<?php

namespace App\Http\Controllers\Api;

use App\Enums\{CommissionStatus, AccountPayableStatus};
use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\{AccountPayable, Appointment, AppointmentPayment, Commission, Service, Professional, ProfessionalOpenWindow, Promotion};
use App\Services\PromotionApplicabilityService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\{DB, Log};
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class AppointmentController extends Controller
{
    public function __construct(private readonly PromotionApplicabilityService $promotionApplicability)
    {
        //
    }

    public function index(Request $request)
    {
        $appointments = Appointment::with(['customer', 'services', 'items', 'promotion', 'payments'])
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
                'promotion_id',
                'notes',
            ]);

            $services = $request->input('services', []);
            $date     = $payload['date'] ?? $request->input('date');

            $this->validateServicesTimeSlots($date, $services, null);

            $items = $request->input('items', []);

            $this->assertPromotionApplicableOrFail(
                $payload['promotion_id'] ?? null,
                $date,
                $services,
                $items
            );

            $appointment = Appointment::create($payload);

            $this->syncServices($appointment, $services);
            $this->syncItems($appointment, $items);

            $this->recalculateAppointmentTiming($appointment);

            return (new AppointmentResource(
                $appointment->load(['customer', 'services', 'items', 'promotion', 'payments'])
            ))
                ->response()
                ->setStatusCode(Response::HTTP_CREATED);
        });
    }

    public function show(Appointment $appointment)
    {
        $appointment->load(['customer', 'services', 'items', 'promotion', 'payments']);

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

            $effectivePromotionId = array_key_exists('promotion_id', $payload)
                ? $payload['promotion_id']
                : $appointment->promotion_id;

            $effectiveDate = $payload['date']
                ?? optional($appointment->date)->format('Y-m-d');

            $effectiveServicesPayload = $request->has('services')
                ? (array) $request->input('services', [])
                : $appointment->services()->get(['services.id'])->map(fn($s) => ['id' => $s->id])->toArray();

            $effectiveItemsPayload = $request->has('items')
                ? (array) $request->input('items', [])
                : $appointment->items()->get(['items.id'])->map(fn($i) => ['id' => $i->id])->toArray();

            $this->assertPromotionApplicableOrFail(
                $effectivePromotionId ? (int) $effectivePromotionId : null,
                $effectiveDate,
                $effectiveServicesPayload,
                $effectiveItemsPayload
            );

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

            if (!array_key_exists($professionalId, $professionalsCache)) {
                $professionalsCache[$professionalId] = Professional::find($professionalId);
            }
            $professional = $professionalsCache[$professionalId];

            $busyEndDateTime = $this->applyLunchPushBusyEnd($professional, $startDateTime, $endDateTime);

            $slotsByProfessional[$professionalId][] = [
                'service_id' => $serviceId,
                'start'      => $startDateTime,
                'end'        => $busyEndDateTime,
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

            if (!$this->isStartAllowedByWorkSchedule($professional, $startDateTime)) {
                $errors["services.$index.starts_at"][] =
                    'Horário inicial fora do expediente ou dentro do intervalo do profissional.';
            }

            if ($this->hasExternalProfessionalConflictConsideringLunch(
                $date,
                (int) $professionalId,
                $startDateTime,
                $busyEndDateTime,
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

    private function isStartAllowedByWorkSchedule(?Professional $professional, Carbon $start): bool
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
            return true;
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
        if (!$dayNamePt) return false;

        $dayConfig = null;
        foreach ($schedule as $entry) {
            if (!is_array($entry)) continue;
            $entryDay = $entry['day'] ?? null;
            if ($entryDay && mb_strtolower($entryDay) === mb_strtolower($dayNamePt)) {
                $dayConfig = $entry;
                break;
            }
        }

        if (!$dayConfig) return true;

        $isWorkingDay = $dayConfig['isWorkingDay'] ?? true;
        $isDayOff     = $dayConfig['isDayOff'] ?? false;
        if (!$isWorkingDay || $isDayOff) return false;

        $startTime  = $dayConfig['startTime']  ?? null;
        $endTime    = $dayConfig['endTime']    ?? null;
        $lunchStart = $dayConfig['lunchStart'] ?? null;
        $lunchEnd   = $dayConfig['lunchEnd']   ?? null;

        if (!$startTime || !$endTime) return true;

        $workStart = $start->copy()->setTimeFromTimeString($startTime);
        $workEnd   = $start->copy()->setTimeFromTimeString($endTime);

        if ($start->lt($workStart) || $start->gt($workEnd)) {
            return false;
        }

        if ($lunchStart && $lunchEnd) {
            $lStart = $start->copy()->setTimeFromTimeString($lunchStart);
            $lEnd   = $start->copy()->setTimeFromTimeString($lunchEnd);
            if ($lEnd->gt($lStart) && $start->gte($lStart) && $start->lt($lEnd)) {
                return false;
            }
        }

        return true;
    }

    private function hasExternalProfessionalConflict(
        string $date,
        int $professionalId,
        Carbon $start,
        Carbon $end,
        ?int $ignoreAppointmentId = null
    ): bool {
        return Appointment::query()
            ->when($ignoreAppointmentId, fn($q) => $q->where('id', '!=', $ignoreAppointmentId))
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->whereHas('services', function ($q) use ($professionalId, $start, $end) {
                $q->where('professional_id', $professionalId)
                ->where('starts_at', '<', $end->toDateTimeString())
                ->where('ends_at', '>', $start->toDateTimeString());
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

        $timeSlots = $appointment->services
            ->filter(fn($service) => !empty($service->pivot->starts_at) && !empty($service->pivot->ends_at))
            ->map(function ($service) {
                return [
                    'start'           => Carbon::parse($service->pivot->starts_at),
                    'end'             => Carbon::parse($service->pivot->ends_at),
                    'professional_id' => $service->pivot->professional_id,
                ];
            });

        if ($timeSlots->isEmpty()) {
            return;
        }

        /** @var \Carbon\Carbon $minStart */
        $minStart = $timeSlots->pluck('start')->min();

        $professionalIds = $timeSlots->pluck('professional_id')->filter()->unique()->values()->all();
        $professionalsById = Professional::whereIn('id', $professionalIds)->get()->keyBy('id');

        $maxBusyEnd = null;

        foreach ($timeSlots as $slot) {
            /** @var Carbon $start */
            $start = $slot['start'];
            /** @var Carbon $end */
            $end   = $slot['end'];

            $busyEnd = $end->copy();

            $professionalId = $slot['professional_id'] ?? null;
            $professional = $professionalId ? ($professionalsById[$professionalId] ?? null) : null;

            if ($professional) {
                $lunch = $this->getLunchIntervalForProfessionalOnDate($professional, $start);
                if ($lunch) {
                    [$lStart, $lEnd] = $lunch;

                    if ($start->lt($lEnd) && $lStart->lt($end)) {
                        $lunchMinutes = $lStart->diffInMinutes($lEnd);
                        if ($lunchMinutes > 0) {
                            $busyEnd->addMinutes($lunchMinutes);
                        }
                    }
                }
            }

            if (!$maxBusyEnd || $busyEnd->gt($maxBusyEnd)) {
                $maxBusyEnd = $busyEnd;
            }
        }

        if (!$maxBusyEnd) return;

        $durationMinutes = $minStart->diffInMinutes($maxBusyEnd);

        $appointment->update([
            'start_time' => $minStart->format('H:i:s'),
            'end_time'   => $maxBusyEnd->format('H:i:s'),
            'duration'   => $durationMinutes,
        ]);
    }

    /**
     * Retorna o intervalo de almoço do profissional para a data (mesmo dia do $ref),
     * no formato [Carbon $lStart, Carbon $lEnd] ou null.
     */
    private function getLunchIntervalForProfessionalOnDate(Professional $professional, Carbon $ref): ?array
    {
        if (empty($professional->work_schedule)) return null;

        $schedule = $professional->work_schedule;
        if (!is_array($schedule)) {
            $decoded = json_decode($schedule, true);
            $schedule = is_array($decoded) ? $decoded : [];
        }
        if (empty($schedule)) return null;

        $weekdayIndex = (int) $ref->format('N');

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
        if (!$dayNamePt) return null;

        $dayConfig = null;
        foreach ($schedule as $entry) {
            if (!is_array($entry)) continue;
            $entryDay = $entry['day'] ?? null;
            if ($entryDay && mb_strtolower($entryDay) === mb_strtolower($dayNamePt)) {
                $dayConfig = $entry;
                break;
            }
        }

        if (!$dayConfig) return null;

        $isWorkingDay = $dayConfig['isWorkingDay'] ?? true;
        $isDayOff     = $dayConfig['isDayOff'] ?? false;
        if (!$isWorkingDay || $isDayOff) return null;

        $lunchStart = $dayConfig['lunchStart'] ?? null;
        $lunchEnd   = $dayConfig['lunchEnd'] ?? null;

        if (!$lunchStart || !$lunchEnd) return null;

        $lStart = $ref->copy()->setTimeFromTimeString($lunchStart);
        $lEnd   = $ref->copy()->setTimeFromTimeString($lunchEnd);

        if ($lEnd->lte($lStart)) return null;

        return [$lStart, $lEnd];
    }

    public function calendar(Request $request)
    {
        $query = Appointment::with(['customer', 'services', 'payments'])
            ->when($request->filled('professional_id'), function ($q) use ($request) {
                $q->whereHas('services', fn($sub) => $sub->where('professional_id', $request->professional_id));
            })
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->when(
                $request->filled('start_date') && $request->filled('end_date'),
                fn($q) => $q->whereBetween('date', [$request->start_date, $request->end_date])
            )
            ->when(
                $request->filled('date') && !$request->filled('start_date'),
                fn($q) => $q->whereDate('date', $request->date)
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
            'promotion_id'    => ['nullable', 'exists:promotions,id'],
            'payments'                  => ['required', 'array', 'min:1'],
            'payments.*.method'         => ['required', 'string', 'max:50'],
            'payments.*.amount'         => ['required', 'numeric', 'min:0.01'],
            'payments.*.fee_percent'    => ['nullable', 'numeric', 'min:0'],
            'payments.*.card_brand'     => ['nullable', 'string', 'max:50'],
            'payments.*.installments'   => ['nullable', 'integer', 'min:1'],
            'payments.*.meta'           => ['nullable', 'array'],
            'payments.*.notes'          => ['nullable', 'string', 'max:255'],
        ]);

        try {
            DB::transaction(function () use ($data, $appointment) {
                $appointment->loadMissing(['customer', 'services', 'items', 'payments']);

                $appointment->fill(Arr::only($data, [
                    'discount_type',
                    'discount_amount',
                    'promotion_id',
                ]));

                $promoId = $appointment->promotion_id ? (int) $appointment->promotion_id : null;

                if ($promoId) {
                    $servicesPayload = $appointment->services->map(fn($s) => ['id' => $s->id])->toArray();
                    $itemsPayload    = $appointment->items->map(fn($i) => ['id' => $i->id])->toArray();

                    $this->assertPromotionApplicableOrFail(
                        $promoId,
                        optional($appointment->date)->format('Y-m-d') ?? now()->toDateString(),
                        $servicesPayload,
                        $itemsPayload
                    );
                }

                if (!$appointment->end_time) {
                    $appointment->end_time = now();
                }
                if ($appointment->status !== 'completed') {
                    $appointment->status = 'completed';
                }

                $servicesTotal = $appointment->services->sum(fn($s) => (float) $s->pivot->service_price);
                $productsTotal = $appointment->items->sum(fn($i) => (float) $i->pivot->price * (int) $i->pivot->quantity);
                $subtotal      = $servicesTotal + $productsTotal;

                $promo = null;
                if ($appointment->promotion_id) {
                    $promo = Promotion::query()
                        ->with(['services:id', 'items:id'])
                        ->find((int) $appointment->promotion_id);
                }

                if ($promo) {
                    if ($promo->min_purchase_amount !== null && (float) $subtotal < (float) $promo->min_purchase_amount) {
                        throw ValidationException::withMessages([
                            'promotion_id' => 'Esta promoção exige um valor mínimo de compra.',
                        ]);
                    }

                    $discountType = $promo->discount_type?->value ?? (string) $promo->discount_type;
                    $discountRaw  = (float) $promo->discount_value;

                    $discountValue = $discountType === 'percentage'
                        ? $subtotal * ($discountRaw / 100)
                        : min($discountRaw, $subtotal);

                    if ($promo->max_discount !== null) {
                        $discountValue = min($discountValue, (float) $promo->max_discount);
                    }

                    $appointment->discount_type   = $discountType;
                    $appointment->discount_amount = $discountRaw;
                } else {
                    $discountType = $appointment->discount_type ?: 'percentage';
                    $discountRaw  = (float) ($appointment->discount_amount ?? 0);

                    $discountValue = $discountType === 'percentage'
                        ? $subtotal * ($discountRaw / 100)
                        : min($discountRaw, $subtotal);
                }

                $totalAfterDiscount = $subtotal - $discountValue;

                $toCents = fn($v) => (int) round(((float) $v) * 100);

                $expectedBaseCents = $toCents($totalAfterDiscount);

                $appointment->payments()->delete();

                $sumBaseCents   = 0;
                $sumAmountCents = 0;

                foreach ($data['payments'] as $p) {
                    $method     = (string) $p['method'];
                    $amount     = round((float) $p['amount'], 2);
                    $feePercent = (float) ($p['fee_percent'] ?? 0);

                    $isCreditLike = in_array($method, ['credit', 'credit_link'], true);

                    if ($isCreditLike && empty($p['card_brand'])) {
                        throw ValidationException::withMessages([
                            'payments' => 'Cartão de crédito exige a bandeira (card_brand).',
                        ]);
                    }

                    $hasFee    = $feePercent > 0 && $isCreditLike;
                    $baseAmount = $hasFee
                        ? round($amount / (1 + ($feePercent / 100)), 2)
                        : $amount;

                    $feeAmount = $hasFee
                        ? round($amount - $baseAmount, 2)
                        : 0.00;

                    $baseCents   = $toCents($baseAmount);
                    $amountCents = $toCents($amount);

                    $sumBaseCents   += $baseCents;
                    $sumAmountCents += $amountCents;

                    $meta = $p['meta'] ?? null;
                    if (!empty($p['notes'])) {
                        $meta = is_array($meta) ? $meta : [];
                        $meta['notes'] = (string) $p['notes'];
                    }

                    $appointment->payments()->create([
                        'method'       => $method,
                        'base_amount'  => number_format($baseCents / 100, 2, '.', ''),
                        'fee_percent'  => $hasFee ? number_format($feePercent, 2, '.', '') : '0.00',
                        'fee_amount'   => number_format($toCents($feeAmount) / 100, 2, '.', ''),
                        'amount'       => number_format($amountCents / 100, 2, '.', ''),
                        'card_brand'   => $p['card_brand'] ?? null,
                        'installments' => $p['installments'] ?? null,
                        'meta'         => $meta,
                    ]);
                }

                if ($sumBaseCents !== $expectedBaseCents) {
                    throw ValidationException::withMessages([
                        'payments' => 'A soma dos pagamentos (sem taxa) deve ser igual ao valor após desconto.',
                    ]);
                }

                $appointment->total_price   = number_format($toCents($subtotal) / 100, 2, '.', '');
                $appointment->final_price   = number_format($sumAmountCents / 100, 2, '.', '');
                $appointment->payment_status = 'paid';

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

                    Commission::create([
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

                    AccountPayable::create([
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
            $appointment->load(['customer', 'services', 'items', 'promotion', 'payments'])
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

    private function getDayConfig(?Professional $professional, Carbon $date): ?array
    {
        if (!$professional || empty($professional->work_schedule)) return null;

        $schedule = $professional->work_schedule;

        if (!is_array($schedule)) {
            $decoded = json_decode($schedule, true);
            $schedule = is_array($decoded) ? $decoded : [];
        }

        if (empty($schedule)) return null;

        $weekdayIndex = (int) $date->format('N');

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
        if (!$dayNamePt) return null;

        foreach ($schedule as $entry) {
            if (!is_array($entry)) continue;
            $entryDay = $entry['day'] ?? null;
            if ($entryDay && mb_strtolower($entryDay) === mb_strtolower($dayNamePt)) {
                return $entry;
            }
        }

        return null;
    }

    private function applyLunchPushBusyEnd(?Professional $professional, Carbon $start, Carbon $end): Carbon
    {
        $dayConfig = $this->getDayConfig($professional, $start);
        if (!$dayConfig) return $end;

        $lunchStart = $dayConfig['lunchStart'] ?? null;
        $lunchEnd   = $dayConfig['lunchEnd'] ?? null;

        if (!$lunchStart || !$lunchEnd) return $end;

        $lStart = $start->copy()->setTimeFromTimeString($lunchStart);
        $lEnd   = $start->copy()->setTimeFromTimeString($lunchEnd);

        if ($lEnd->lessThanOrEqualTo($lStart)) return $end;

        $overlapsLunch = $start->lt($lEnd) && $end->gt($lStart);
        if (!$overlapsLunch) return $end;

        $lunchMinutes = $lStart->diffInMinutes($lEnd);
        return $end->copy()->addMinutes($lunchMinutes);
    }

    private function hasExternalProfessionalConflictConsideringLunch(
        string $dateYmd,
        int $professionalId,
        Carbon $newStart,
        Carbon $newBusyEnd,
        ?int $ignoreAppointmentId = null
    ): bool {
        $professional = Professional::find($professionalId);

        $appointments = Appointment::query()
            ->when($ignoreAppointmentId, fn($q) => $q->where('id', '!=', $ignoreAppointmentId))
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->whereDate('date', $dateYmd)
            ->whereHas('services', fn($q) => $q->where('professional_id', $professionalId))
            ->with('services')
            ->get();

        foreach ($appointments as $appt) {
            foreach ($appt->services as $srv) {
                if ((int) ($srv->pivot->professional_id ?? 0) !== $professionalId) continue;
                if (empty($srv->pivot->starts_at) || empty($srv->pivot->ends_at)) continue;

                $s = Carbon::parse($srv->pivot->starts_at);
                $e = Carbon::parse($srv->pivot->ends_at);

                $busyE = $this->applyLunchPushBusyEnd($professional, $s, $e);

                if ($this->timeRangesOverlap($s, $busyE, $newStart, $newBusyEnd)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function isPromotionApplicableOnDate(Promotion $promo, Carbon $date): bool
    {
        if (!$promo->active) return false;

        $start = $promo->start_date ? Carbon::parse($promo->start_date)->startOfDay() : null;
        $end   = $promo->end_date ? Carbon::parse($promo->end_date)->endOfDay() : null;

        if ($start && $date->lt($start)) return false;
        if ($end && $date->gt($end)) return false;

        if (!$promo->is_recurring || empty($promo->recurrence_type)) {
            return true;
        }

        $weekday = $date->dayOfWeek;

        if ($promo->recurrence_type === 'weekly') {
            $days = is_array($promo->recurrence_weekdays) ? $promo->recurrence_weekdays : [];
            return empty($days) ? true : in_array($weekday, $days, true);
        }

        if ($promo->recurrence_type === 'monthly_weekday') {
            $days = is_array($promo->recurrence_weekdays) ? $promo->recurrence_weekdays : [];
            $okDay = empty($days) ? true : in_array($weekday, $days, true);
            if (!$okDay) return false;

            $targetWeek = $promo->recurrence_week_of_month ? (int) $promo->recurrence_week_of_month : null;
            if (!$targetWeek) return true;

            $first = $date->copy()->startOfMonth();
            $firstOccur = $first->copy()->nextOrSame($weekday);

            if ($date->lt($firstOccur)) return false;

            $weekIndex = intdiv($date->day - $firstOccur->day, 7) + 1;
            return $weekIndex === $targetWeek;
        }

        if ($promo->recurrence_type === 'yearly') {
            $md = trim((string) $promo->recurrence_day_of_year);
            if (!$md || !str_contains($md, '-')) return false;

            [$mmStr, $ddStr] = explode('-', $md);
            $mm = (int) $mmStr;
            $dd = (int) $ddStr;

            if ($mm < 1 || $mm > 12 || $dd < 1 || $dd > 31) return false;

            return ((int)$date->month === $mm) && ((int)$date->day === $dd);
        }

        return false;
    }

    private function validatePromotionForDate(?int $promotionId, ?string $dateYmd): void
    {
        if (!$promotionId) return;

        if (!$dateYmd) {
            throw ValidationException::withMessages([
                'date' => 'A data do agendamento é obrigatória para validar a promoção.',
            ]);
        }

        $promo = Promotion::find($promotionId);

        if (!$promo) {
            throw ValidationException::withMessages([
                'promotion_id' => 'Promoção inválida.',
            ]);
        }

        $date = Carbon::parse($dateYmd)->startOfDay();

        if (!$this->isPromotionApplicableOnDate($promo, $date)) {
            throw ValidationException::withMessages([
                'promotion_id' => 'Esta promoção não é válida para a data selecionada.',
            ]);
        }
    }

    private function assertPromotionApplicableOrFail(
        ?int $promotionId,
        string $dateYmd,
        array $servicesPayload = [],
        array $itemsPayload = []
    ): void {
        if (!$promotionId) return;

        $promo = Promotion::query()
            ->with(['services:id', 'items:id'])
            ->find($promotionId);

        if (!$promo) {
            throw ValidationException::withMessages([
                'promotion_id' => 'Promoção não encontrada.',
            ]);
        }

        $serviceIds = $this->extractServiceIds($servicesPayload);
        $itemIds    = $this->extractItemIds($itemsPayload);

        $date = Carbon::parse($dateYmd);

        if (!$this->promotionApplicability->isApplicable($promo, $date, $serviceIds, $itemIds)) {
            throw ValidationException::withMessages([
                'promotion_id' => 'Esta promoção não é aplicável para esta data e/ou para os serviços/itens selecionados.',
            ]);
        }
    }

    private function extractServiceIds(array $services): array
    {
        $ids = [];
        foreach ($services as $s) {
            $id = $s['service_id'] ?? $s['id'] ?? null;
            if ($id) $ids[] = (int) $id;
        }
        return array_values(array_unique($ids));
    }

    private function extractItemIds(array $items): array
    {
        $ids = [];
        foreach ($items as $i) {
            $id = $i['item_id'] ?? $i['id'] ?? null;
            if ($id) $ids[] = (int) $id;
        }
        return array_values(array_unique($ids));
    }
}
