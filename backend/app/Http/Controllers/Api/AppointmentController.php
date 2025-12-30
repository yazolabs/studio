<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\{AccountPayable, Appointment, Commission, Service, Professional, ProfessionalOpenWindow};
use App\Enums\{CommissionStatus, AccountPayableStatus};
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\{DB, Log};
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;



class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $appointments = Appointment::with(['customer', 'services', 'items', 'promotion'])
            ->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get();

        return AppointmentResource::collection($appointments);
    }

    public function store(Request $request)
    {
        return DB::transaction(function () use ($request) {
            $payload = Arr::only($request->all(), [
                'customer_id',
                'date',
                'start_time',
                'end_time',
                'duration',
                'status',
                'payment_status',
                'total_price',
                'discount_amount',
                'discount_type',
                'final_price',
                'payment_method',
                'card_brand',
                'installments',
                'installment_fee',
                'promotion_id',
                'notes',
            ]);

            $services = $request->input('services', []);
            $date     = $payload['date'] ?? $request->input('date');

            $this->validateServicesTimeSlots($date, $services, null);

            $appointment = Appointment::create($payload);

            $items = $request->input('items', []);

            $this->syncServices($appointment, $services);
            $this->syncItems($appointment, $items);

            $this->recalculateAppointmentTiming($appointment);

            return (new AppointmentResource(
                $appointment->load(['customer', 'services', 'items', 'promotion'])
            ))
                ->response()
                ->setStatusCode(Response::HTTP_CREATED);
        });
    }

    public function show(Appointment $appointment)
    {
        $appointment->load(['customer', 'services', 'items', 'promotion']);

        return new AppointmentResource($appointment);
    }

    public function update(Request $request, Appointment $appointment)
    {
        return DB::transaction(function () use ($request, $appointment) {
            $payload = Arr::only($request->all(), [
                'customer_id',
                'date',
                'start_time',
                'end_time',
                'duration',
                'status',
                'payment_status',
                'total_price',
                'discount_amount',
                'discount_type',
                'final_price',
                'payment_method',
                'card_brand',
                'installments',
                'installment_fee',
                'promotion_id',
                'notes',
            ]);

            $appointment->update($payload);

            $services = $request->has('services')
                ? $request->input('services', [])
                : null;

            if (!is_null($services)) {
                $date = $payload['date']
                    ?? optional($appointment->date)->format('Y-m-d');

                $this->validateServicesTimeSlots($date, $services, $appointment->id);

                $this->syncServices($appointment, $services);
            }

            if ($request->has('items')) {
                $this->syncItems($appointment, $request->input('items', []));
            }

            $this->recalculateAppointmentTiming($appointment);

            return new AppointmentResource(
                $appointment->load(['customer', 'services', 'items', 'promotion'])
            );
        });
    }

    public function destroy(Appointment $appointment)
    {
        if ($appointment->status === 'completed') {
            return response()->json([
                'message' => 'Não é possível excluir um agendamento já concluído.',
            ], 422);
        }

        $appointment->services()->detach();
        $appointment->items()->detach();
        $appointment->delete();

        return response()->noContent();
    }

    private function syncServices(Appointment $appointment, $services): void
    {
        $appointment->services()->detach();

        $services = (array) $services;

        if (empty($services)) {
            return;
        }

        foreach ($services as $service) {
            $serviceId = $service['service_id'] ?? $service['id'] ?? null;
            if (!$serviceId) {
                continue;
            }

            $serviceModel = Service::find($serviceId);

            $commissionType = !empty($service['commission_type'])
                ? $service['commission_type']
                : ($serviceModel?->commission_type ?? 'percentage');

            $commissionValue =
                isset($service['commission_value']) &&
                $service['commission_value'] !== null &&
                $service['commission_value'] !== ''
                ? $service['commission_value']
                : ($serviceModel?->commission_value ?? 0);

            $servicePrice =
                isset($service['service_price']) &&
                $service['service_price'] !== null &&
                $service['service_price'] !== ''
                ? $service['service_price']
                : ($serviceModel?->price ?? 0);

            $appointment->services()->attach($serviceId, [
                'service_price'    => $servicePrice,
                'commission_type'  => $commissionType,
                'commission_value' => $commissionValue,
                'professional_id'  => $service['professional_id'] ?? null,
                'starts_at'        => $service['starts_at'] ?? null,
                'ends_at'          => $service['ends_at'] ?? null,
            ]);
        }
    }

    private function syncItems(Appointment $appointment, $items): void
    {
        $pivotData = [];

        foreach ((array) $items as $item) {
            $itemId = $item['item_id'] ?? $item['id'] ?? null;
            if (!$itemId) {
                continue;
            }

            $pivotData[$itemId] = [
                'price'    => $item['price'] ?? 0,
                'quantity' => $item['quantity'] ?? 1,
            ];
        }

        $appointment->items()->sync($pivotData);
    }

    private function validateServicesTimeSlots($date, $services, ?int $appointmentId = null): void
    {
        $services = (array) $services;

        if (empty($services)) {
            return;
        }

        if (!$date) {
            throw ValidationException::withMessages([
                'date' => 'A data do agendamento é obrigatória para validar os horários dos serviços.',
            ]);
        }

        $date = Carbon::parse($date)->toDateString();

        $errors              = [];
        $slotsByProfessional = [];
        $professionalsCache  = [];
        $windowsConfigured   = [];

        foreach ($services as $index => $service) {
            $serviceId      = $service['service_id'] ?? $service['id'] ?? null;
            $professionalId = $service['professional_id'] ?? null;
            $start          = $service['starts_at'] ?? null;
            $end            = $service['ends_at'] ?? null;

            if (!$professionalId) {
                $errors["services.$index.professional_id"][] =
                    'Profissional é obrigatório para cada serviço.';
                continue;
            }

            if (!$start || !$end) {
                $errors["services.$index.starts_at"][] =
                    'Horário inicial e final são obrigatórios para cada serviço.';
                continue;
            }

            try {
                $startDateTime = $this->parseServiceDateTime($date, $start);
                $endDateTime   = $this->parseServiceDateTime($date, $end);
            } catch (\Throwable $e) {
                $errors["services.$index.starts_at"][] = 'Formato de horário inválido.';
                continue;
            }

            if ($endDateTime->lessThanOrEqualTo($startDateTime)) {
                $errors["services.$index.ends_at"][] =
                    'O horário de término deve ser maior que o horário de início.';
                continue;
            }

            $slotsByProfessional[$professionalId][] = [
                'service_id' => $serviceId,
                'start'      => $startDateTime,
                'end'        => $endDateTime,
                'index'      => $index,
            ];

            if (!array_key_exists($professionalId, $windowsConfigured)) {
                $windowsConfigured[$professionalId] = ProfessionalOpenWindow::where('professional_id', $professionalId)->exists();
            }

            if ($windowsConfigured[$professionalId]) {
                $hasOpenWindow = ProfessionalOpenWindow::open()
                    ->where('professional_id', $professionalId)
                    ->forDate($date)
                    ->exists();

                if (!$hasOpenWindow) {
                    $errors["services.$index.starts_at"][] =
                        'O profissional não possui janela de atendimento aberta para esta data.';
                }
            }

            if (!array_key_exists($professionalId, $professionalsCache)) {
                $professionalsCache[$professionalId] = Professional::find($professionalId);
            }

            $professional = $professionalsCache[$professionalId];

            if (!$this->isWithinWorkSchedule($professional, $startDateTime, $endDateTime)) {
                $errors["services.$index.starts_at"][] =
                    'Horário fora da agenda de trabalho configurada para o profissional.';
            }

            if ($this->hasExternalProfessionalConflict(
                $date,
                $professionalId,
                $startDateTime,
                $endDateTime,
                $appointmentId
            )) {
                $errors["services.$index.starts_at"][] =
                    'Já existe outro agendamento para este profissional neste horário.';
            }
        }

        foreach ($slotsByProfessional as $professionalId => $slots) {
            $count = count($slots);

            for ($i = 0; $i < $count; $i++) {
                for ($j = $i + 1; $j < $count; $j++) {
                    if ($this->timeRangesOverlap(
                        $slots[$i]['start'],
                        $slots[$i]['end'],
                        $slots[$j]['start'],
                        $slots[$j]['end']
                    )) {
                        $indexA = $slots[$i]['index'];
                        $indexB = $slots[$j]['index'];

                        $errors["services.$indexA.starts_at"][] =
                            'Conflito de horário entre serviços do mesmo profissional neste agendamento.';
                        $errors["services.$indexB.starts_at"][] =
                            'Conflito de horário entre serviços do mesmo profissional neste agendamento.';
                    }
                }
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function isWithinWorkSchedule(?Professional $professional, Carbon $start, Carbon $end): bool
    {
        if (!$professional || empty($professional->work_schedule)) {
            return true;
        }

        $schedule = $professional->work_schedule;

        if (!is_array($schedule)) {
            $decoded = json_decode($schedule, true);
            $schedule = is_array($decoded) ? $decoded : [];
        }

        if (empty($schedule)) {
            return false;
        }

        $weekdayIndex = (int) $start->format('N');

        $dayMap = [
            1 => 'Segunda-feira',
            2 => 'Terça-feira',
            3 => 'Quarta-feira',
            4 => 'Quinta-feira',
            5 => 'Sexta-feira',
            6 => 'Sábado',
            7 => 'Domingo',
        ];

        $dayNamePt = $dayMap[$weekdayIndex] ?? null;

        if (!$dayNamePt) {
            return false;
        }

        $dayConfig = null;
        foreach ($schedule as $entry) {
            if (!is_array($entry)) {
                continue;
            }

            $entryDay = $entry['day'] ?? null;

            if ($entryDay && mb_strtolower($entryDay) === mb_strtolower($dayNamePt)) {
                $dayConfig = $entry;
                break;
            }
        }

        if (!$dayConfig) {
            return false;
        }

        $isWorkingDay = $dayConfig['isWorkingDay'] ?? true;
        $isDayOff     = $dayConfig['isDayOff'] ?? false;

        if (!$isWorkingDay || $isDayOff) {
            return false;
        }

        $startTime   = $dayConfig['startTime']   ?? null;
        $endTime     = $dayConfig['endTime']     ?? null;
        $lunchStart  = $dayConfig['lunchStart']  ?? null;
        $lunchEnd    = $dayConfig['lunchEnd']    ?? null;

        if (!$startTime || !$endTime) {
            return false;
        }

        $intervals = [];

        if ($lunchStart && $lunchEnd) {
            $intervals[] = [
                'start' => $start->copy()->setTimeFromTimeString($startTime),
                'end'   => $start->copy()->setTimeFromTimeString($lunchStart),
            ];
            $intervals[] = [
                'start' => $start->copy()->setTimeFromTimeString($lunchEnd),
                'end'   => $start->copy()->setTimeFromTimeString($endTime),
            ];
        } else {
            $intervals[] = [
                'start' => $start->copy()->setTimeFromTimeString($startTime),
                'end'   => $start->copy()->setTimeFromTimeString($endTime),
            ];
        }

        foreach ($intervals as $interval) {
            /** @var Carbon $intervalStart */
            $intervalStart = $interval['start'];
            /** @var Carbon $intervalEnd */
            $intervalEnd   = $interval['end'];

            if (
                $start->greaterThanOrEqualTo($intervalStart)
                && $end->lessThanOrEqualTo($intervalEnd)
            ) {
                return true;
            }
        }

        return false;
    }

    private function hasExternalProfessionalConflict(string $date, int $professionalId, Carbon $start, Carbon $end, ?int $ignoreAppointmentId = null): bool
    {
        return Appointment::whereDate('date', $date)
            ->when(
                $ignoreAppointmentId,
                fn($q) =>
                $q->where('id', '!=', $ignoreAppointmentId)
            )

            ->where(function ($q) {
                $q->where('status', '!=', 'cancelled')
                    ->where('status', '!=', 'no_show');
            })
            ->whereHas('services', function ($q) use ($professionalId, $start, $end) {
                $q->where('professional_id', $professionalId)
                    ->where(function ($query) use ($start, $end) {
                        $query->where('starts_at', '<', $end->toDateTimeString())
                            ->where('ends_at', '>', $start->toDateTimeString());
                    });
            })
            ->exists();
    }

    private function timeRangesOverlap(Carbon $startA, Carbon $endA, Carbon $startB, Carbon $endB): bool
    {
        return $startA->lt($endB) && $startB->lt($endA);
    }

    private function recalculateAppointmentTiming(Appointment $appointment): void
    {
        $appointment->load('services');

        $date = $appointment->date
            ? $appointment->date->format('Y-m-d')
            : now()->toDateString();

        $timeSlots = $appointment->services
            ->filter(
                fn($service) =>
                ! empty($service->pivot->starts_at) &&
                    ! empty($service->pivot->ends_at)
            )
            ->map(function ($service) {
                return [
                    'start' => Carbon::parse($service->pivot->starts_at),
                    'end'   => Carbon::parse($service->pivot->ends_at),
                ];
            });

        if ($timeSlots->isEmpty()) {
            return;
        }

        $starts = $timeSlots->pluck('start');
        $ends   = $timeSlots->pluck('end');

        /** @var \Carbon\Carbon $minStart */
        $minStart = $starts->min();
        /** @var \Carbon\Carbon $maxEnd */
        $maxEnd   = $ends->max();

        $durationMinutes = $minStart->diffInMinutes($maxEnd);

        $appointment->update([
            'start_time' => $minStart->format('H:i:s'),
            'end_time'   => $maxEnd->format('H:i:s'),
            'duration'   => $durationMinutes,
        ]);
    }

    public function calendar(Request $request)
    {
        $query = Appointment::with(['customer', 'services'])
            ->when($request->filled('professional_id'), function ($q) use ($request) {
                $q->whereHas(
                    'services',
                    fn($sub) =>
                    $sub->where('professional_id', $request->professional_id)
                );
            })
            ->when(
                $request->filled('status'),
                fn($q) =>
                $q->where('status', $request->status)
            )
            ->when(
                $request->filled('start_date') && $request->filled('end_date'),
                fn($q) =>
                $q->whereBetween('date', [$request->start_date, $request->end_date])
            )
            ->when(
                $request->filled('date') && !$request->filled('start_date'),
                fn($q) =>
                $q->whereDate('date', $request->date)
            )
            ->orderBy('date')
            ->orderBy('start_time');

        return AppointmentResource::collection($query->get());
    }

    public function checkout(Request $request, Appointment $appointment)
    {
        $data = $request->validate([
            'discount_type'   => ['nullable', 'in:percentage,fixed'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_method'  => ['required', 'string', 'max:50'],
            'card_brand'      => ['nullable', 'string', 'max:50'],
            'installments'    => ['nullable', 'integer', 'min:1'],
            'installment_fee' => ['nullable', 'numeric', 'min:0'],
            'promotion_id'    => ['nullable', 'exists:promotions,id'],
        ]);

        try {
            DB::transaction(function () use ($data, $appointment) {
                // Garante que services/items estão carregados
                $appointment->loadMissing(['customer', 'services', 'items']);

                Log::info('CHECKOUT STARTED', [
                    'appointment_id' => $appointment->id,
                    'payload'        => $data,
                ]);

                $appointment->fill($data);

                if (!$appointment->end_time) {
                    $appointment->end_time = now();
                }

                if ($appointment->status !== 'completed') {
                    $appointment->status = 'completed';
                }

                $servicesTotal = $appointment->services->sum(
                    fn($s) => (float) $s->pivot->service_price
                );

                $productsTotal = $appointment->items->sum(
                    fn($i) => (float) $i->pivot->price * (int) $i->pivot->quantity
                );

                $subtotal = $servicesTotal + $productsTotal;

                $discountType = $appointment->discount_type ?: 'percentage';
                $discountRaw  = $appointment->discount_amount ?? 0;

                if ($discountType === 'percentage') {
                    $discountValue = $subtotal * ($discountRaw / 100);
                } else {
                    $discountValue = min($discountRaw, $subtotal);
                }

                $totalAfterDiscount = $subtotal - $discountValue;

                $installmentFeePercent = $appointment->installment_fee ?? 0;

                $installmentFeeValue =
                    $appointment->payment_method === 'credit'
                    ? ($totalAfterDiscount * $installmentFeePercent) / 100
                    : 0;

                $finalPrice = $totalAfterDiscount + $installmentFeeValue;

                $appointment->total_price     = $subtotal;
                $appointment->discount_type   = $discountType;
                $appointment->discount_amount = $discountRaw;
                $appointment->installment_fee = $installmentFeePercent;
                $appointment->final_price     = round($finalPrice, 2);

                if ($appointment->payment_status !== 'prepaid') {
                    $appointment->payment_status = 'paid';
                }

                $appointment->save();

                $appointment->load(['services', 'items', 'customer']);

                $createdCommissions = 0;
                $createdAccounts    = 0;

                foreach ($appointment->services as $service) {
                    $professionalId  = $service->pivot->professional_id;
                    $commissionType  = $service->pivot->commission_type;
                    $commissionValue = $service->pivot->commission_value;
                    $servicePrice    = $service->pivot->service_price;

                    if (!$professionalId) {
                        Log::warning('SERVICE WITHOUT PROFESSIONAL ON CHECKOUT', [
                            'appointment_id' => $appointment->id,
                            'service_id'     => $service->id,
                        ]);
                        continue;
                    }

                    $commissionAmount = $commissionType === 'percentage'
                        ? $servicePrice * ($commissionValue / 100)
                        : $commissionValue;

                    $commission = Commission::create([
                        'professional_id'   => $professionalId,
                        'appointment_id'    => $appointment->id,
                        'service_id'        => $service->id,
                        'customer_id'       => $appointment->customer_id,
                        'date'              => now()->toDateString(),
                        'service_price'     => $servicePrice,
                        'commission_type'   => $commissionType,
                        'commission_value'  => $commissionValue,
                        'commission_amount' => $commissionAmount,
                        'status'            => CommissionStatus::Pending,
                    ]);

                    $createdCommissions++;

                    $account = AccountPayable::create([
                        'description'     => "Comissão: {$service->name}",
                        'amount'          => $commissionAmount,
                        'due_date'        => now()->addDays(7)->toDateString(),
                        'status'          => AccountPayableStatus::Pending,
                        'category'        => 'Comissões',
                        'professional_id' => $professionalId,
                        'appointment_id'  => $appointment->id,
                        'reference'       => "APP-{$appointment->id}-SRV-{$service->id}",
                    ]);

                    $createdAccounts++;
                }

                Log::info('CHECKOUT COMPLETED', [
                    'appointment_id'      => $appointment->id,
                    'commissions_created' => $createdCommissions,
                    'accounts_created'    => $createdAccounts,
                    'total_price'         => $appointment->total_price,
                    'final_price'         => $appointment->final_price,
                ]);
            });
        } catch (\Throwable $e) {
            Log::error('CHECKOUT FAILED', [
                'appointment_id' => $appointment->id ?? null,
                'message'        => $e->getMessage(),
                'file'           => $e->getFile(),
                'line'           => $e->getLine(),
            ]);

            throw $e;
        }

        return (new AppointmentResource(
            $appointment->load(['customer', 'services', 'items', 'promotion'])
        ))
            ->response()
            ->setStatusCode(Response::HTTP_OK);
    }

    private function parseServiceDateTime(string $date, string $value): Carbon
    {
        $trimmed = trim($value);

        if (preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $trimmed)) {
            return Carbon::parse($date . ' ' . $trimmed);
        }

        return Carbon::parse($trimmed);
    }
}
