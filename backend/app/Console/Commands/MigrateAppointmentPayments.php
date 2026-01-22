<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateLegacyAppointmentPayments extends Command
{
    protected $signature = 'payments:migrate-legacy
        {--dry-run : Não grava no banco, só simula}
        {--only-missing : Migra só appointments sem registros em appointment_payments}
        {--chunk=500 : Tamanho do chunk}';

    protected $description = 'Migra pagamentos legados de appointments.* para appointment_payments';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $onlyMissing = (bool) $this->option('only-missing');
        $chunk = (int) $this->option('chunk');

        $this->info('== Migração de pagamentos legados ==');
        $this->info('dry-run: ' . ($dryRun ? 'SIM' : 'NÃO'));
        $this->info('only-missing: ' . ($onlyMissing ? 'SIM' : 'NÃO'));
        $this->info('chunk: ' . $chunk);

        $q = DB::table('appointments')
            ->select([
                'id',
                'payment_method',
                'card_brand',
                'installments',
                'installment_fee',
                'total_price',
                'discount_amount',
                'final_price',
                'payment_status',
                'created_at',
                'updated_at',
            ])
            ->whereNotNull('payment_method')
            ->where('payment_method', '!=', '')
            ->where('final_price', '>', 0)
            ->whereNull('deleted_at');

        if ($onlyMissing) {
            $q->whereNotExists(function ($sq) {
                $sq->select(DB::raw(1))
                  ->from('appointment_payments')
                  ->whereColumn('appointment_payments.appointment_id', 'appointments.id');
            });
        }

        $total = (clone $q)->count();
        $this->info("Appointments elegíveis: {$total}");

        if ($total === 0) {
            $this->info('Nada para migrar.');
            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $inserted = 0;
        $skipped = 0;

        $q->orderBy('id')->chunkById($chunk, function ($rows) use (&$inserted, &$skipped, $bar, $dryRun) {
            DB::beginTransaction();

            try {
                foreach ($rows as $a) {
                    $exists = DB::table('appointment_payments')
                        ->where('appointment_id', $a->id)
                        ->exists();

                    if ($exists) {
                        $skipped++;
                        $bar->advance();
                        continue;
                    }

                    $method = (string) $a->payment_method;

                    $amount = round((float) $a->final_price, 2);

                    $feePercent = 0.0;
                    if ($method === 'credit') {
                        $feePercent = round((float) ($a->installment_fee ?? 0), 2);
                    }

                    $totalPrice = round((float) ($a->total_price ?? 0), 2);
                    $discountAmount = round((float) ($a->discount_amount ?? 0), 2);

                    $baseCandidate = round(max(0, $totalPrice - $discountAmount), 2);

                    $baseAmount = $amount;
                    $feeAmount = 0.0;

                    if ($feePercent > 0) {
                        $expectedTotal = round($baseCandidate * (1 + ($feePercent / 100)), 2);

                        if ($amount === $expectedTotal) {
                            $baseAmount = $baseCandidate;
                            $feeAmount = round($amount - $baseCandidate, 2);
                        } elseif ($amount === $baseCandidate) {
                            $baseAmount = $amount;
                            $feeAmount = 0.0;
                        } else {
                            $baseAmount = round($amount / (1 + ($feePercent / 100)), 2);
                            $feeAmount = round($amount - $baseAmount, 2);
                        }
                    }

                    $payload = [
                        'appointment_id' => $a->id,
                        'method' => $method,
                        'base_amount' => $baseAmount,
                        'fee_percent' => $feePercent,
                        'fee_amount' => $feeAmount,
                        'amount' => $amount,
                        'card_brand' => $a->card_brand ?: null,
                        'installments' => $a->installments ?: null,
                        'meta' => json_encode([
                            'migrated_from' => 'appointments',
                            'legacy_payment_status' => $a->payment_status ?? null,
                            'legacy_total_price' => $totalPrice,
                            'legacy_discount_amount' => $discountAmount,
                            'legacy_final_price' => $amount,
                            'calc' => [
                                'base_candidate' => $baseCandidate,
                                'expected_total_with_fee' => $feePercent > 0
                                    ? round($baseCandidate * (1 + ($feePercent / 100)), 2)
                                    : null,
                            ],
                        ]),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    if (!$dryRun) {
                        DB::table('appointment_payments')->insert($payload);
                    }

                    $inserted++;
                    $bar->advance();
                }

                if ($dryRun) DB::rollBack();
                else DB::commit();
            } catch (\Throwable $e) {
                DB::rollBack();
                throw $e;
            }
        });

        $bar->finish();
        $this->newLine(2);

        $this->info("Inseridos (ou simulados): {$inserted}");
        $this->info("Ignorados (já existiam): {$skipped}");
        $this->info("Fim.");

        return self::SUCCESS;
    }
}
