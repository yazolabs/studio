<?php

namespace App\Http\Controllers\Api;

use App\Enums\{CommissionStatus, AccountPayableStatus, AppointmentPaymentStatus, TransactionType};
use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\{AccountPayable, Appointment, AppointmentService, CashierTransaction, Commission, Service, Professional, ProfessionalOpenWindow, Promotion};
use App\Services\PromotionApplicabilityService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\{Arr, Str};
use Illuminate\Support\Facades\{Auth, DB, Log};
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
        $query = Appointment::query()
            ->with([
                'customer',
                'services',
                'items',
                'payments',
                'appointmentServices.service',
                'appointmentServices.promotions',
            ])
            ->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc');

        if ($search = trim((string) $request->get('search', ''))) {
            $query->where(function ($q) use ($search) {
                if (ctype_digit($search)) {
                    $q->orWhere('id', (int) $search);
                }

                $q->orWhereHas('customer', function ($cq) use ($search) {
                    $cq->where('name', 'like', "%{$search}%");
                });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }
        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }
        if ($request->filled('professional_id')) {
            $pid = (int) $request->professional_id;
            $query->whereHas('appointmentServices', fn ($q) => $q->where('professional_id', $pid));
        }

        return AppointmentResource::collection($query->get());
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
                'notes',
                'group_id',
                'group_sequence',
            ]);

            $services = (array) $request->input('services', []);
            $date     = $payload['date'] ?? $request->input('date');

            $this->validateServicesTimeSlots($date, $services, null);

            $appliedOn = $date
                ? Carbon::parse($date)->toDateString()
                : now()->toDateString();

            $this->assertServicePromotionsApplicableOrFail($services, $appliedOn);

            $items = (array) $request->input('items', []);

            $hasGroupSequence = array_key_exists('group_sequence', $payload) && $payload['group_sequence'] !== null && $payload['group_sequence'] !== '';
            $groupIdEmpty = !array_key_exists('group_id', $payload) || empty($payload['group_id']);

            if ($hasGroupSequence && $groupIdEmpty) {
                $payload['group_id'] = (string) Str::uuid();
            }

            $appointment = Appointment::create($payload);

            $this->syncServices($appointment, $services);
            $this->syncItems($appointment, $items);

            $this->recalculateAppointmentTiming($appointment);

            return (new AppointmentResource(
                $appointment->load([
                    'customer',
                    'services',
                    'items',
                    'payments',
                    'appointmentServices.service',
                    'appointmentServices.promotions',
                ])
            ))
                ->response()
                ->setStatusCode(Response::HTTP_CREATED);
        });
    }

    public function show(Appointment $appointment)
    {
        $appointment->load([
            'customer',
            'services',
            'items',
            'payments',
            'appointmentServices.service',
            'appointmentServices.promotions',
        ]);

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
                'notes',
                'group_id',
                'group_sequence',
            ]);

            $appointment->update($payload);

            $services = $request->has('services')
                ? (array) $request->input('services', [])
                : null;

            if (!is_null($services)) {
                $date = $payload['date']
                    ?? optional($appointment->date)->format('Y-m-d');

                $this->validateServicesTimeSlots($date, $services, $appointment->id);

                $appliedOn = $date
                    ? Carbon::parse($date)->toDateString()
                    : now()->toDateString();

                $this->assertServicePromotionsApplicableOrFail($services, $appliedOn);

                $this->syncServices($appointment, $services);
            }

            if ($request->has('items')) {
                $this->syncItems($appointment, (array) $request->input('items', []));
            }

            $this->recalculateAppointmentTiming($appointment);

            return new AppointmentResource(
                $appointment->load([
                    'customer',
                    'services',
                    'items',
                    'payments',
                    'appointmentServices.service',
                    'appointmentServices.promotions',
                ])
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

        DB::transaction(function () use ($appointment) {
            CashierTransaction::where('reference', "APP-{$appointment->id}-CHECKOUT")->delete();
            CashierTransaction::where('reference', "APP-{$appointment->id}-PREPAY")->delete();
            Commission::where('appointment_id', $appointment->id)->delete();
            AccountPayable::where('appointment_id', $appointment->id)->delete();
            $appointment->payments()->delete();
            AppointmentService::where('appointment_id', $appointment->id)->delete();
            $appointment->items()->detach();
            $appointment->delete();
        });

        return response()->noContent();
    }

    private function syncServices(Appointment $appointment, $services): void
    {
        $services = (array) $services;

        $existing = AppointmentService::query()
            ->with(['promotions'])
            ->where('appointment_id', $appointment->id)
            ->get();

        $existingPromosByKey = [];
        foreach ($existing as $row) {
            $key = implode('|', [
                (int) $row->service_id,
                (int) ($row->professional_id ?? 0),
                $row->starts_at ? Carbon::parse($row->starts_at)->toDateTimeString() : '',
            ]);

            $existingPromosByKey[$key] = $row->promotions->map(function ($p) {
                return [
                    'id' => (int) $p->id,
                    'sort_order' => (int) ($p->pivot->sort_order ?? 0),
                    'applied_value' => $p->pivot->applied_value,
                    'applied_percent' => $p->pivot->applied_percent,
                    'discount_amount' => $p->pivot->discount_amount,
                    'applied_by_user_id' => $p->pivot->applied_by_user_id,
                ];
            })->values()->all();
        }

        AppointmentService::where('appointment_id', $appointment->id)->delete();

        if (empty($services)) {
            return;
        }

        foreach ($services as $service) {
            $serviceId = $service['service_id'] ?? $service['id'] ?? null;
            if (!$serviceId) continue;

            $serviceModel = Service::find($serviceId);

            $commissionType = !empty($service['commission_type'])
                ? $service['commission_type']
                : ($serviceModel?->commission_type ?? 'percentage');

            $commissionValue =
                isset($service['commission_value']) && $service['commission_value'] !== '' && $service['commission_value'] !== null
                    ? $service['commission_value']
                    : ($serviceModel?->commission_value ?? 0);

            $servicePrice =
                isset($service['service_price']) && $service['service_price'] !== '' && $service['service_price'] !== null
                    ? $service['service_price']
                    : ($serviceModel?->price ?? 0);

            $startsAt = $service['starts_at'] ?? null;

            $aps = AppointmentService::create([
                'appointment_id'    => $appointment->id,
                'service_id'        => (int) $serviceId,
                'professional_id'   => $service['professional_id'] ?? null,
                'service_price'     => $servicePrice,
                'commission_type'   => $commissionType,
                'commission_value'  => $commissionValue,
                'starts_at'         => $startsAt,
                'ends_at'           => $service['ends_at'] ?? null,
            ]);

            $hasPromotionsKey = array_key_exists('promotions', $service);

            $promos = $hasPromotionsKey
                ? (array) ($service['promotions'] ?? [])
                : null;

            if (!$hasPromotionsKey) {
                $key = implode('|', [
                    (int) $serviceId,
                    (int) (($service['professional_id'] ?? 0) ?: 0),
                    $startsAt ? Carbon::parse($startsAt)->toDateTimeString() : '',
                ]);

                $promos = $existingPromosByKey[$key] ?? [];
            }

            if (!empty($promos)) {
                $sync = [];

                foreach ($promos as $idx => $p) {
                    $pid = $p['promotion_id'] ?? $p['id'] ?? null;
                    if (!$pid) continue;

                    $sync[(int) $pid] = [
                        'sort_order'         => (int) ($p['sort_order'] ?? $idx),
                        'applied_value'      => $p['applied_value'] ?? null,
                        'applied_percent'    => $p['applied_percent'] ?? null,
                        'discount_amount'    => $p['discount_amount'] ?? null,
                        'applied_by_user_id' => $p['applied_by_user_id'] ?? Auth::id(),
                    ];
                }

                if (!empty($sync)) {
                    $aps->promotions()->sync($sync);
                }
            }
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
        $query = Appointment::with([
                'customer',
                'services',
                'payments',
                'appointmentServices.service',
                'appointmentServices.promotions',
            ])
            ->when($request->filled('professional_id'), function ($q) use ($request) {
                $q->whereHas('appointmentServices', fn($sub) => $sub->where('professional_id', (int) $request->professional_id));
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
            'discount_type'           => ['nullable', 'in:percentage,fixed'],
            'discount_amount'         => ['nullable', 'numeric', 'min:0'],
            'appointment_services'                              => ['sometimes', 'array'],
            'appointment_services.*.id'                         => ['required_with:appointment_services', 'integer', 'exists:appointment_service,id'],
            'appointment_services.*.promotions'                 => ['nullable', 'array'],
            'appointment_services.*.promotions.*.id'            => ['nullable', 'integer'],
            'appointment_services.*.promotions.*.promotion_id'  => ['nullable', 'integer', 'exists:promotions,id'],
            'appointment_services.*.promotions.*.sort_order'    => ['nullable', 'integer', 'min:0'],
            'services_to_add'                       => ['sometimes', 'array'],
            'services_to_add.*.service_id'          => ['required_with:services_to_add', 'integer', 'exists:services,id'],
            'services_to_add.*.professional_id'     => ['nullable', 'integer', 'exists:professionals,id'],
            'services_to_add.*.service_price'       => ['required_with:services_to_add', 'numeric', 'min:0'],
            'services_to_add.*.commission_type'     => ['nullable', 'in:percentage,fixed'],
            'services_to_add.*.commission_value'    => ['nullable', 'numeric', 'min:0'],
            'services_to_add.*.promotion_ids'       => ['nullable', 'array'],
            'services_to_add.*.promotion_ids.*'     => ['integer', 'exists:promotions,id'],
            'payments'                => ['nullable', 'array'],
            'payments.*.method'       => ['required_with:payments', 'string', 'max:50'],
            'payments.*.amount'       => ['required_with:payments', 'numeric', 'min:0'],
            'payments.*.fee_percent'  => ['nullable', 'numeric', 'min:0'],
            'payments.*.card_brand'   => ['nullable', 'string', 'max:50'],
            'payments.*.installments' => ['nullable', 'integer', 'min:1'],
            'payments.*.meta'         => ['nullable', 'array'],
            'payments.*.notes'        => ['nullable', 'string', 'max:255'],
        ]);

        $toCents = fn ($v) => (int) round(((float) $v) * 100);

        try {
            DB::transaction(function () use ($appointment, $data, $toCents) {
                $appointment->loadMissing([
                    'customer',
                    'items',
                    'appointmentServices.service',
                    'appointmentServices.promotions',
                    'payments',
                ]);

                if (!empty($data['services_to_add']) && is_array($data['services_to_add'])) {
                    foreach ($data['services_to_add'] as $row) {
                        $aps = $appointment->appointmentServices()->create([
                            'service_id'        => (int) $row['service_id'],
                            'professional_id'   => !empty($row['professional_id']) ? (int) $row['professional_id'] : null,
                            'service_price'     => number_format((float) $row['service_price'], 2, '.', ''),
                            'commission_type'   => $row['commission_type'] ?? 'percentage',
                            'commission_value'  => isset($row['commission_value'])
                                ? number_format((float) $row['commission_value'], 2, '.', '')
                                : '0.00',
                        ]);

                        $promoIds = isset($row['promotion_ids']) && is_array($row['promotion_ids'])
                            ? array_values(array_filter(array_map('intval', $row['promotion_ids'])))
                            : [];

                        if (!empty($promoIds)) {
                            $sync = [];
                            foreach ($promoIds as $idx => $pid) {
                                $sync[$pid] = [
                                    'sort_order' => $idx,
                                    'applied_by_user_id' => Auth::id(),
                                ];
                            }
                            $aps->promotions()->sync($sync);
                        }
                    }

                    $appointment->unsetRelation('appointmentServices');
                    $appointment->loadMissing(['appointmentServices.service', 'appointmentServices.promotions']);
                }

                if (!empty($data['appointment_services'])) {
                    $byId = $appointment->appointmentServices->keyBy('id');

                    foreach ($data['appointment_services'] as $row) {
                        $apsId = (int) ($row['id'] ?? 0);
                        if (!$apsId || !$byId->has($apsId)) {
                            throw ValidationException::withMessages([
                                'appointment_services' => 'Um ou mais appointment_services não pertencem a este agendamento.',
                            ]);
                        }

                        if (!array_key_exists('promotions', $row)) continue;

                        $aps = $byId->get($apsId);

                        $promos = (array) ($row['promotions'] ?? []);
                        $sync = [];

                        foreach ($promos as $idx => $p) {
                            $pid = $p['promotion_id'] ?? $p['id'] ?? null;
                            if (!$pid) continue;

                            $sync[(int) $pid] = [
                                'sort_order' => (int) ($p['sort_order'] ?? $idx),
                                'applied_by_user_id' => Auth::id(),
                            ];
                        }

                        $aps->promotions()->sync($sync);
                    }

                    $appointment->unsetRelation('appointmentServices');
                    $appointment->loadMissing(['appointmentServices.service', 'appointmentServices.promotions']);
                }

                $appointment->end_time = now()->format('H:i:s');
                if ($appointment->status !== 'completed') $appointment->status = 'completed';

                $servicesTotal = $appointment->appointmentServices->sum(fn ($aps) => (float) $aps->service_price);
                $productsTotal = $appointment->items->sum(fn ($i) => (float) $i->pivot->price * (int) $i->pivot->quantity);
                $subtotal      = (float) $servicesTotal + (float) $productsTotal;

                $promoDiscountTotal = 0.0;

                $dateYmd = optional($appointment->date)->format('Y-m-d') ?? now()->toDateString();
                $dateObj = Carbon::parse($dateYmd);

                $itemIds = $appointment->items->pluck('id')->map(fn ($id) => (int) $id)->values()->all();

                foreach ($appointment->appointmentServices as $aps) {
                    $serviceBase = round((float) $aps->service_price, 2);
                    $remaining   = $serviceBase;

                    $promos = $aps->promotions
                        ->sortBy(fn ($p) => (int) ($p->pivot->sort_order ?? 0))
                        ->values();

                    foreach ($promos as $promo) {
                        if (!$this->promotionApplicability->isApplicable($promo, $dateObj, [(int) $aps->service_id], $itemIds)) {
                            throw ValidationException::withMessages([
                                'appointment_services' => "Promoção '{$promo->name}' não é aplicável para este serviço/data/itens.",
                            ]);
                        }

                        if ($promo->min_purchase_amount !== null && $subtotal < (float) $promo->min_purchase_amount) {
                            throw ValidationException::withMessages([
                                'appointment_services' => "Promoção '{$promo->name}' exige valor mínimo de compra.",
                            ]);
                        }

                        $discountType = $promo->discount_type?->value ?? (string) $promo->discount_type;
                        $discountRaw  = (float) $promo->discount_value;

                        $discount = 0.0;

                        if ($remaining > 0) {
                            if ($discountType === 'percentage') $discount = round($remaining * ($discountRaw / 100), 2);
                            else $discount = round(min($discountRaw, $remaining), 2);

                            if ($promo->max_discount !== null) $discount = min($discount, (float) $promo->max_discount);
                            $discount = max(0.0, min($discount, $remaining));
                        }

                        $remaining -= $discount;
                        $promoDiscountTotal += $discount;

                        $aps->promotions()->updateExistingPivot($promo->id, [
                            'applied_percent'    => $discountType === 'percentage' ? $discountRaw : null,
                            'applied_value'      => $discountType === 'fixed' ? $discountRaw : null,
                            'discount_amount'    => $discount,
                            'applied_by_user_id' => Auth::id(),
                        ]);
                    }
                }

                $afterPromos = max(0.0, round($subtotal - $promoDiscountTotal, 2));

                if (array_key_exists('discount_type', $data) || array_key_exists('discount_amount', $data)) {
                    $appointment->discount_type   = $data['discount_type'] ?? $appointment->discount_type;
                    $appointment->discount_amount = $data['discount_amount'] ?? $appointment->discount_amount;
                }

                $manualType = $appointment->discount_type ?: 'percentage';
                $manualRaw  = (float) ($appointment->discount_amount ?? 0);

                $manualDiscount = 0.0;
                if ($manualRaw > 0) {
                    $manualDiscount = $manualType === 'percentage'
                        ? round($afterPromos * ($manualRaw / 100), 2)
                        : round(min($manualRaw, $afterPromos), 2);
                }

                $totalAfterDiscount = max(0.0, round($afterPromos - $manualDiscount, 2));
                $expectedBaseCents  = $toCents($totalAfterDiscount);

                $existingBaseCents = $appointment->payments->sum(fn ($pay) => $toCents((float) $pay->base_amount));
                $existingAmountCents = $appointment->payments->sum(fn ($pay) => $toCents((float) $pay->amount));

                $alreadyFullyPaid = ($expectedBaseCents > 0)
                    ? (($existingBaseCents + 1) >= $expectedBaseCents)
                    : true;

                $ignoreIncomingPayments = $alreadyFullyPaid;

                $payments = $data['payments'] ?? [];
                if (empty($payments)) $payments = [];

                $sumBaseCents   = $existingBaseCents;
                $sumAmountCents = $existingAmountCents;

                if (!$ignoreIncomingPayments) {
                    if ($expectedBaseCents > 0) {
                        if (empty($payments)) {
                            throw ValidationException::withMessages([
                                'payments' => 'Informe ao menos um pagamento.',
                            ]);
                        }

                        foreach ($payments as $idx => $p) {
                            $amt = round((float) ($p['amount'] ?? 0), 2);
                            if ($amt <= 0) {
                                throw ValidationException::withMessages([
                                    "payments.$idx.amount" => 'O valor do pagamento deve ser maior que zero.',
                                ]);
                            }
                        }
                    } else {
                        foreach ($payments as $idx => $p) {
                            $amt = round((float) ($p['amount'] ?? 0), 2);
                            if ($amt != 0.0) {
                                throw ValidationException::withMessages([
                                    "payments.$idx.amount" => 'Quando o valor final é R$ 0,00, os pagamentos devem ser R$ 0,00.',
                                ]);
                            }
                        }
                    }

                    $appointment->payments()->delete();

                    $sumBaseCents   = 0;
                    $sumAmountCents = 0;

                    foreach ($payments as $p) {
                        $method     = (string) $p['method'];
                        $baseAmount = round((float) ($p['amount'] ?? 0), 2);

                        $feePercent   = (float) ($p['fee_percent'] ?? 0);
                        $isCreditLike = in_array($method, ['credit', 'credit_link'], true);

                        if ($isCreditLike && $baseAmount > 0 && empty($p['card_brand'])) {
                            throw ValidationException::withMessages([
                                'payments' => 'Cartão de crédito exige a bandeira (card_brand).',
                            ]);
                        }

                        $hasFee = $isCreditLike && $feePercent > 0 && $baseAmount > 0;

                        $grossAmount = $hasFee
                            ? round($baseAmount * (1 + ($feePercent / 100)), 2)
                            : $baseAmount;

                        $feeAmount = $hasFee
                            ? round($grossAmount - $baseAmount, 2)
                            : 0.00;

                        $baseCents   = $toCents($baseAmount);
                        $amountCents = $toCents($grossAmount);

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

                    if ($expectedBaseCents > 0) {
                        $diff = abs($sumBaseCents - $expectedBaseCents);
                        if ($diff > 1) {
                            $got = number_format($sumBaseCents / 100, 2, ',', '.');
                            $exp = number_format($expectedBaseCents / 100, 2, ',', '.');
                            throw ValidationException::withMessages([
                                'payments' => "A soma dos pagamentos (sem taxa) deve ser igual ao valor líquido (após promoções e descontos). Informado: R$ {$got} • Esperado: R$ {$exp}.",
                            ]);
                        }
                    }

                    $appointment->unsetRelation('payments');
                    $appointment->load(['payments']);
                }

                $appointment->total_price = number_format($toCents($subtotal) / 100, 2, '.', '');
                $appointment->final_price = number_format($sumAmountCents / 100, 2, '.', '');

                $appointment->payment_status = AppointmentPaymentStatus::Paid->value;
                $appointment->save();

                $appointment->unsetRelation('payments');
                $appointment->load(['payments', 'customer']);

                $cashierDate  = optional($appointment->date)->toDateString() ?? now()->toDateString();
                $refCheckout  = "APP-{$appointment->id}-CHECKOUT";
                $customerName = $appointment->customer?->name ?? "Cliente";

                CashierTransaction::where('reference', $refCheckout)
                    ->where('category', 'Atendimentos')
                    ->where('type', TransactionType::Income)
                    ->delete();

                if (!$ignoreIncomingPayments) {
                    foreach ($appointment->payments as $pay) {
                        if ((float) $pay->amount <= 0) continue;

                        CashierTransaction::create([
                            'date'           => $cashierDate,
                            'type'           => TransactionType::Income,
                            'category'       => 'Atendimentos',
                            'description'    => "Checkout agendamento #{$appointment->id} - {$customerName}",
                            'amount'         => $pay->amount,
                            'payment_method' => $pay->method,
                            'reference'      => $refCheckout,
                            'user_id'        => Auth::id(),
                            'notes'          => null,
                        ]);
                    }
                }

                $appointment->loadMissing(['appointmentServices.service', 'customer']);

                Commission::where('appointment_id', $appointment->id)->delete();

                AccountPayable::where('appointment_id', $appointment->id)
                    ->where('category', 'Comissões')
                    ->where('reference', 'like', "APP-{$appointment->id}-%")
                    ->delete();

                foreach ($appointment->appointmentServices as $aps) {
                    $professionalId  = $aps->professional_id;
                    $commissionType  = $aps->commission_type;
                    $commissionValue = $aps->commission_value;
                    $servicePrice    = (float) $aps->service_price;

                    if (!$professionalId) {
                        Log::warning('SERVICE WITHOUT PROFESSIONAL ON CHECKOUT', [
                            'appointment_id' => $appointment->id,
                            'appointment_service_id' => $aps->id,
                            'service_id' => $aps->service_id,
                        ]);
                        continue;
                    }

                    $commissionAmount = $commissionType === 'percentage'
                        ? $servicePrice * ((float) $commissionValue / 100)
                        : (float) $commissionValue;

                    Commission::create([
                        'professional_id'   => $professionalId,
                        'appointment_id'    => $appointment->id,
                        'service_id'        => $aps->service_id,
                        'customer_id'       => $appointment->customer_id,
                        'date'              => now()->toDateString(),
                        'service_price'     => $servicePrice,
                        'commission_type'   => $commissionType,
                        'commission_value'  => $commissionValue,
                        'commission_amount' => $commissionAmount,
                        'status'            => CommissionStatus::Pending,
                    ]);

                    $serviceName = $aps->relationLoaded('service') && $aps->service
                        ? $aps->service->name
                        : "Serviço #{$aps->service_id}";

                    AccountPayable::create([
                        'description'     => "Comissão: {$serviceName}",
                        'amount'          => $commissionAmount,
                        'due_date'        => now()->addDays(7)->toDateString(),
                        'status'          => AccountPayableStatus::Pending,
                        'category'        => 'Comissões',
                        'professional_id' => $professionalId,
                        'appointment_id'  => $appointment->id,
                        'reference'       => "APP-{$appointment->id}-APS-{$aps->id}",
                    ]);
                }
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
            $appointment->load([
                'customer',
                'items',
                'payments',
                'appointmentServices.service',
                'appointmentServices.promotions',
            ])
        ))
            ->response()
            ->setStatusCode(Response::HTTP_OK);
    }

    public function prepay(Request $request, Appointment $appointment)
    {
        $data = $request->validate([
            'received_date'           => ['nullable', 'date'],
            'discount_type'           => ['nullable', 'in:percentage,fixed'],
            'discount_amount'         => ['nullable', 'numeric', 'min:0'],
            'appointment_services'                         => ['sometimes', 'array'],
            'appointment_services.*.id'                    => ['required_with:appointment_services', 'integer', 'exists:appointment_service,id'],
            'appointment_services.*.promotions'            => ['nullable', 'array'],
            'appointment_services.*.promotions.*.id'       => ['nullable', 'integer', 'exists:promotions,id'],
            'appointment_services.*.promotions.*.promotion_id' => ['nullable', 'integer', 'exists:promotions,id'],
            'appointment_services.*.promotions.*.sort_order'   => ['nullable', 'integer', 'min:0'],
            'payments'                => ['nullable', 'array'],
            'payments.*.method'       => ['required_with:payments', 'string', 'max:50'],
            'payments.*.amount'       => ['required_with:payments', 'numeric', 'min:0'],
            'payments.*.fee_percent'  => ['nullable', 'numeric', 'min:0'],
            'payments.*.card_brand'   => ['nullable', 'string', 'max:50'],
            'payments.*.installments' => ['nullable', 'integer', 'min:1'],
            'payments.*.meta'         => ['nullable', 'array'],
            'payments.*.notes'        => ['nullable', 'string', 'max:255'],
        ]);

        $toCents = fn ($v) => (int) round(((float) $v) * 100);

        try {
            DB::transaction(function () use ($appointment, $data, $toCents) {
                $appointment->loadMissing([
                    'customer',
                    'items',
                    'appointmentServices.service',
                    'appointmentServices.promotions',
                ]);

                if (!empty($data['appointment_services'])) {
                    $byId = $appointment->appointmentServices->keyBy('id');

                    foreach ($data['appointment_services'] as $row) {
                        $apsId = (int) ($row['id'] ?? 0);
                        if (!$apsId || !$byId->has($apsId)) {
                            throw ValidationException::withMessages([
                                'appointment_services' => 'Um ou mais appointment_services não pertencem a este agendamento.',
                            ]);
                        }

                        if (!array_key_exists('promotions', $row)) {
                            continue;
                        }

                        $aps = $byId->get($apsId);

                        $promos = (array) ($row['promotions'] ?? []);
                        $sync = [];

                        foreach ($promos as $idx => $p) {
                            $pid = $p['promotion_id'] ?? $p['id'] ?? null;
                            if (!$pid) continue;

                            $sync[(int) $pid] = [
                                'sort_order' => (int) ($p['sort_order'] ?? $idx),
                                'applied_by_user_id' => Auth::id(),
                            ];
                        }

                        $aps->promotions()->sync($sync);
                    }

                    $appointment->unsetRelation('appointmentServices');
                    $appointment->loadMissing(['appointmentServices.service', 'appointmentServices.promotions']);
                }

                $servicesTotal = $appointment->appointmentServices->sum(fn ($aps) => (float) $aps->service_price);
                $productsTotal = $appointment->items->sum(fn ($i) => (float) $i->pivot->price * (int) $i->pivot->quantity);
                $subtotal      = (float) $servicesTotal + (float) $productsTotal;

                $promoDiscountTotal = 0.0;

                $dateYmd = optional($appointment->date)->format('Y-m-d') ?? now()->toDateString();
                $dateObj = Carbon::parse($dateYmd);

                $itemIds = $appointment->items->pluck('id')->map(fn($id) => (int) $id)->values()->all();

                foreach ($appointment->appointmentServices as $aps) {
                    $serviceBase = round((float) $aps->service_price, 2);
                    $remaining   = $serviceBase;

                    $promos = $aps->promotions
                        ->sortBy(fn ($p) => (int) ($p->pivot->sort_order ?? 0))
                        ->values();

                    foreach ($promos as $promo) {
                        if (!$this->promotionApplicability->isApplicable($promo, $dateObj, [(int) $aps->service_id], $itemIds)) {
                            throw ValidationException::withMessages([
                                'appointment_services' => "Promoção '{$promo->name}' não é aplicável para este serviço/data/itens.",
                            ]);
                        }

                        if ($promo->min_purchase_amount !== null && $subtotal < (float) $promo->min_purchase_amount) {
                            throw ValidationException::withMessages([
                                'appointment_services' => "Promoção '{$promo->name}' exige valor mínimo de compra.",
                            ]);
                        }

                        $discountType = $promo->discount_type?->value ?? (string) $promo->discount_type;
                        $discountRaw  = (float) $promo->discount_value;

                        $discount = 0.0;

                        if ($remaining > 0) {
                            if ($discountType === 'percentage') {
                                $discount = round($remaining * ($discountRaw / 100), 2);
                            } else {
                                $discount = round(min($discountRaw, $remaining), 2);
                            }

                            if ($promo->max_discount !== null) {
                                $discount = min($discount, (float) $promo->max_discount);
                            }

                            $discount = max(0.0, min($discount, $remaining));
                        }

                        $remaining -= $discount;
                        $promoDiscountTotal += $discount;

                        $aps->promotions()->updateExistingPivot($promo->id, [
                            'applied_percent'    => $discountType === 'percentage' ? $discountRaw : null,
                            'applied_value'      => $discountType === 'fixed' ? $discountRaw : null,
                            'discount_amount'    => $discount,
                            'applied_by_user_id' => Auth::id(),
                        ]);
                    }
                }

                $afterPromos = max(0.0, round($subtotal - $promoDiscountTotal, 2));

                if (array_key_exists('discount_type', $data) || array_key_exists('discount_amount', $data)) {
                    $appointment->discount_type   = $data['discount_type'] ?? $appointment->discount_type;
                    $appointment->discount_amount = $data['discount_amount'] ?? $appointment->discount_amount;
                }

                $manualType = $appointment->discount_type ?: 'percentage';
                $manualRaw  = (float) ($appointment->discount_amount ?? 0);

                $manualDiscount = 0.0;
                if ($manualRaw > 0) {
                    $manualDiscount = $manualType === 'percentage'
                        ? round($afterPromos * ($manualRaw / 100), 2)
                        : round(min($manualRaw, $afterPromos), 2);
                }

                $totalAfterDiscount = max(0.0, round($afterPromos - $manualDiscount, 2));
                $expectedBaseCents  = $toCents($totalAfterDiscount);

                $payments = $data['payments'] ?? [];
                if (empty($payments)) $payments = [];

                foreach ($payments as $idx => $p) {
                    $amt = round((float) ($p['amount'] ?? 0), 2);
                    if ($amt < 0) {
                        throw ValidationException::withMessages([
                            "payments.$idx.amount" => 'O valor do pagamento não pode ser negativo.',
                        ]);
                    }
                }

                $appointment->payments()->delete();

                $sumBaseCents   = 0;
                $sumAmountCents = 0;

                foreach ($payments as $p) {
                    $method     = (string) $p['method'];
                    $baseAmount = round((float) ($p['amount'] ?? 0), 2);

                    $feePercent   = (float) ($p['fee_percent'] ?? 0);
                    $isCreditLike = in_array($method, ['credit', 'credit_link'], true);

                    if ($isCreditLike && $baseAmount > 0 && empty($p['card_brand'])) {
                        throw ValidationException::withMessages([
                            'payments' => 'Cartão de crédito exige a bandeira (card_brand).',
                        ]);
                    }

                    $hasFee = $isCreditLike && $feePercent > 0 && $baseAmount > 0;

                    $grossAmount = $hasFee
                        ? round($baseAmount * (1 + ($feePercent / 100)), 2)
                        : $baseAmount;

                    $feeAmount = $hasFee
                        ? round($grossAmount - $baseAmount, 2)
                        : 0.00;

                    $baseCents   = $toCents($baseAmount);
                    $amountCents = $toCents($grossAmount);

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

                if ($sumBaseCents > ($expectedBaseCents + 1)) {
                    $got = number_format($sumBaseCents / 100, 2, ',', '.');
                    $exp = number_format($expectedBaseCents / 100, 2, ',', '.');
                    throw ValidationException::withMessages([
                        'payments' => "O total recebido não pode ultrapassar o valor do agendamento. Recebido: R$ {$got} • Esperado: R$ {$exp}.",
                    ]);
                }

                if ($expectedBaseCents <= 0) {
                    $status = AppointmentPaymentStatus::Paid->value;
                } else {
                    $status = $sumBaseCents <= 0
                        ? AppointmentPaymentStatus::Unpaid->value
                        : (($sumBaseCents + 1) >= $expectedBaseCents
                            ? AppointmentPaymentStatus::Paid->value
                            : AppointmentPaymentStatus::Partial->value);
                }

                $appointment->total_price    = number_format($toCents($subtotal) / 100, 2, '.', '');
                $appointment->final_price    = number_format($sumAmountCents / 100, 2, '.', '');
                $appointment->payment_status = $status;
                $appointment->save();

                $appointment->unsetRelation('payments');
                $appointment->load(['payments', 'customer']);

                $cashierDate  = !empty($data['received_date'])
                    ? Carbon::parse($data['received_date'])->toDateString()
                    : now()->toDateString();

                $refPrepay    = "APP-{$appointment->id}-PREPAY";
                $customerName = $appointment->customer?->name ?? "Cliente";

                CashierTransaction::where('reference', $refPrepay)
                    ->where('category', 'Atendimentos')
                    ->where('type', TransactionType::Income)
                    ->delete();

                foreach ($appointment->payments as $pay) {
                    if ((float) $pay->amount <= 0) {
                        continue;
                    }

                    CashierTransaction::create([
                        'date'           => $cashierDate,
                        'type'           => TransactionType::Income,
                        'category'       => 'Atendimentos',
                        'description'    => "Pré-pago agendamento #{$appointment->id} - {$customerName}",
                        'amount'         => $pay->amount,
                        'payment_method' => $pay->method,
                        'reference'      => $refPrepay,
                        'user_id'        => Auth::id(),
                        'notes'          => 'PREPAID',
                    ]);
                }

                Log::info('PREPAY COMPLETED', [
                    'appointment_id' => $appointment->id,
                    'cashier_date'   => $cashierDate,
                    'rows'           => $appointment->payments->count(),
                    'total_price'    => $appointment->total_price,
                    'final_price'    => $appointment->final_price,
                    'payment_status' => $appointment->payment_status,
                    'expected_base'  => number_format($expectedBaseCents / 100, 2, '.', ''),
                    'received_base'  => number_format($sumBaseCents / 100, 2, '.', ''),
                ]);
            });
        } catch (\Throwable $e) {
            Log::error('PREPAY FAILED', [
                'appointment_id' => $appointment->id ?? null,
                'message'        => $e->getMessage(),
                'file'           => $e->getFile(),
                'line'           => $e->getLine(),
            ]);

            throw $e;
        }

        return (new AppointmentResource(
            $appointment->load([
                'customer',
                'items',
                'payments',
                'appointmentServices.service',
                'appointmentServices.promotions',
            ])
        ))
            ->response()
            ->setStatusCode(Response::HTTP_OK);
    }

    public function prepayGroup(Request $request)
    {
        $data = $request->validate([
            'group_id'               => ['required', 'uuid'],
            'received_date'          => ['nullable', 'date'],
            'intent'                 => ['nullable', 'in:paid,partial'],
            'payments'               => ['nullable', 'array'],
            'payments.*.method'      => ['required_with:payments', 'string', 'max:50'],
            'payments.*.amount'      => ['required_with:payments', 'numeric', 'min:0'],
            'payments.*.fee_percent' => ['nullable', 'numeric', 'min:0'],
            'payments.*.card_brand'  => ['nullable', 'string', 'max:50'],
            'payments.*.installments'=> ['nullable', 'integer', 'min:1'],
            'payments.*.meta'        => ['nullable', 'array'],
            'payments.*.notes'       => ['nullable', 'string', 'max:255'],
        ]);

        $toCents = fn ($v) => (int) round(((float) $v) * 100);

        $groupId = (string) $data['group_id'];
        $intent  = $data['intent'] ?? null;
        $paymentsInput = $data['payments'] ?? [];

        try {
            DB::transaction(function () use ($groupId, $intent, $paymentsInput, $data, $toCents) {
                $appointments = Appointment::query()
                    ->where('group_id', $groupId)
                    ->with([
                        'customer',
                        'items',
                        'payments',
                        'appointmentServices.service',
                        'appointmentServices.promotions',
                    ])
                    ->orderByRaw('COALESCE(group_sequence, 9999) asc')
                    ->orderBy('date')
                    ->orderBy('start_time')
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();

                if ($appointments->isEmpty()) {
                    throw ValidationException::withMessages([
                        'group_id' => 'Nenhum agendamento encontrado para este group_id.',
                    ]);
                }

                $calcExpectedBaseCentsForAppointment = function (Appointment $appointment) use ($toCents) {
                    $servicesTotal = $appointment->appointmentServices->sum(fn ($aps) => (float) $aps->service_price);
                    $productsTotal = $appointment->items->sum(fn ($i) => (float) $i->pivot->price * (int) $i->pivot->quantity);
                    $subtotal      = (float) $servicesTotal + (float) $productsTotal;

                    $promoDiscountTotal = 0.0;

                    $dateYmd = optional($appointment->date)->format('Y-m-d') ?? now()->toDateString();
                    $dateObj = Carbon::parse($dateYmd);

                    $itemIds = $appointment->items->pluck('id')->map(fn($id) => (int) $id)->values()->all();

                    foreach ($appointment->appointmentServices as $aps) {
                        $serviceBase = round((float) $aps->service_price, 2);
                        $remaining   = $serviceBase;

                        $promos = $aps->promotions
                            ->sortBy(fn ($p) => (int) ($p->pivot->sort_order ?? 0))
                            ->values();

                        foreach ($promos as $promo) {
                            if (!$this->promotionApplicability->isApplicable($promo, $dateObj, [(int) $aps->service_id], $itemIds)) {
                                throw ValidationException::withMessages([
                                    'appointment_services' => "Promoção '{$promo->name}' não é aplicável para este serviço/data/itens.",
                                ]);
                            }

                            if ($promo->min_purchase_amount !== null && $subtotal < (float) $promo->min_purchase_amount) {
                                throw ValidationException::withMessages([
                                    'appointment_services' => "Promoção '{$promo->name}' exige valor mínimo de compra.",
                                ]);
                            }

                            $discountType = $promo->discount_type?->value ?? (string) $promo->discount_type;
                            $discountRaw  = (float) $promo->discount_value;

                            $discount = 0.0;

                            if ($remaining > 0) {
                                if ($discountType === 'percentage') {
                                    $discount = round($remaining * ($discountRaw / 100), 2);
                                } else {
                                    $discount = round(min($discountRaw, $remaining), 2);
                                }

                                if ($promo->max_discount !== null) {
                                    $discount = min($discount, (float) $promo->max_discount);
                                }

                                $discount = max(0.0, min($discount, $remaining));
                            }

                            $remaining -= $discount;
                            $promoDiscountTotal += $discount;
                        }
                    }

                    $afterPromos = max(0.0, round($subtotal - $promoDiscountTotal, 2));

                    $manualType = $appointment->discount_type ?: 'percentage';
                    $manualRaw  = (float) ($appointment->discount_amount ?? 0);

                    $manualDiscount = 0.0;
                    if ($manualRaw > 0) {
                        $manualDiscount = $manualType === 'percentage'
                            ? round($afterPromos * ($manualRaw / 100), 2)
                            : round(min($manualRaw, $afterPromos), 2);
                    }

                    $totalAfterDiscount = max(0.0, round($afterPromos - $manualDiscount, 2));

                    return [
                        'subtotal' => $subtotal,
                        'expected_base_cents' => $toCents($totalAfterDiscount),
                    ];
                };

                $normalizedPayments = [];
                foreach ($paymentsInput as $idx => $p) {
                    $method = (string) ($p['method'] ?? '');
                    $baseAmount = round((float) ($p['amount'] ?? 0), 2);

                    if ($baseAmount < 0) {
                        throw ValidationException::withMessages([
                            "payments.$idx.amount" => 'O valor do pagamento não pode ser negativo.',
                        ]);
                    }

                    $feePercent   = (float) ($p['fee_percent'] ?? 0);
                    $isCreditLike = in_array($method, ['credit', 'credit_link'], true);

                    if ($isCreditLike && $baseAmount > 0 && empty($p['card_brand'])) {
                        throw ValidationException::withMessages([
                            'payments' => 'Cartão de crédito exige a bandeira (card_brand).',
                        ]);
                    }

                    $meta = $p['meta'] ?? null;
                    if (!empty($p['notes'])) {
                        $meta = is_array($meta) ? $meta : [];
                        $meta['notes'] = (string) $p['notes'];
                    }

                    $normalizedPayments[] = [
                        'method'       => $method,
                        'base_amount'  => $baseAmount,
                        'fee_percent'  => $isCreditLike ? max(0.0, $feePercent) : 0.0,
                        'card_brand'   => $p['card_brand'] ?? null,
                        'installments' => $p['installments'] ?? null,
                        'meta'         => $meta,
                        'src_index'    => $idx,
                    ];
                }

                $expectedByAppointment = [];
                $expectedGroupBaseCents = 0;

                foreach ($appointments as $appt) {
                    $calc = $calcExpectedBaseCentsForAppointment($appt);
                    $expectedByAppointment[$appt->id] = $calc;
                    $expectedGroupBaseCents += (int) $calc['expected_base_cents'];
                }

                $sumReceivedBaseCents = 0;
                foreach ($normalizedPayments as $p) {
                    $sumReceivedBaseCents += $toCents($p['base_amount']);
                }

                if ($expectedGroupBaseCents > 0) {
                    if (empty($normalizedPayments)) {
                        throw ValidationException::withMessages([
                            'payments' => 'Informe ao menos um pagamento.',
                        ]);
                    }
                }

                if ($intent === 'paid') {
                    $diff = abs($sumReceivedBaseCents - $expectedGroupBaseCents);
                    if ($diff > 1) {
                        $got = number_format($sumReceivedBaseCents / 100, 2, ',', '.');
                        $exp = number_format($expectedGroupBaseCents / 100, 2, ',', '.');
                        throw ValidationException::withMessages([
                            'payments' => "A soma dos pagamentos (base) deve ser igual ao total do grupo. Informado: R$ {$got} • Esperado: R$ {$exp}.",
                        ]);
                    }
                } elseif ($intent === 'partial') {
                    if ($sumReceivedBaseCents <= 0) {
                        throw ValidationException::withMessages([
                            'payments' => 'No pagamento parcial, informe um valor maior que zero.',
                        ]);
                    }
                    if ($sumReceivedBaseCents >= $expectedGroupBaseCents) {
                        $got = number_format($sumReceivedBaseCents / 100, 2, ',', '.');
                        $exp = number_format($expectedGroupBaseCents / 100, 2, ',', '.');
                        throw ValidationException::withMessages([
                            'payments' => "No pagamento parcial, o total recebido deve ser MENOR que o total do grupo. Recebido: R$ {$got} • Esperado: R$ {$exp}.",
                        ]);
                    }
                } else {
                    if ($sumReceivedBaseCents > ($expectedGroupBaseCents + 1)) {
                        $got = number_format($sumReceivedBaseCents / 100, 2, ',', '.');
                        $exp = number_format($expectedGroupBaseCents / 100, 2, ',', '.');
                        throw ValidationException::withMessages([
                            'payments' => "O total recebido não pode ultrapassar o total do grupo. Recebido: R$ {$got} • Esperado: R$ {$exp}.",
                        ]);
                    }
                }

                $cashierDate = !empty($data['received_date'])
                    ? Carbon::parse($data['received_date'])->toDateString()
                    : now()->toDateString();

                $groupRef = "APPG-{$groupId}-PREPAY";

                foreach ($appointments as $appt) {
                    $appt->payments()->delete();

                    CashierTransaction::where('reference', "APP-{$appt->id}-PREPAY")
                        ->where('category', 'Atendimentos')
                        ->where('type', TransactionType::Income)
                        ->delete();

                    CashierTransaction::where('reference', $groupRef)
                        ->where('category', 'Atendimentos')
                        ->where('type', TransactionType::Income)
                        ->delete();
                }

                $apptQueue = $appointments->values()->all();

                $apptRemaining = [];
                foreach ($apptQueue as $appt) {
                    $apptRemaining[$appt->id] = (int) ($expectedByAppointment[$appt->id]['expected_base_cents'] ?? 0);
                }

                foreach ($normalizedPayments as $p) {
                    $method = $p['method'];
                    $feePercent = (float) $p['fee_percent'];
                    $isCreditLike = in_array($method, ['credit', 'credit_link'], true);

                    $baseLeftCents = $toCents($p['base_amount']);

                    if ($baseLeftCents <= 0) continue;

                    foreach ($apptQueue as $appt) {
                        $need = $apptRemaining[$appt->id] ?? 0;
                        if ($need <= 0) continue;
                        if ($baseLeftCents <= 0) break;

                        $allocBaseCents = min($need, $baseLeftCents);
                        if ($allocBaseCents <= 0) continue;

                        $allocBase = $allocBaseCents / 100;

                        $hasFee = $isCreditLike && $feePercent > 0 && $allocBase > 0;

                        $grossAmount = $hasFee
                            ? round($allocBase * (1 + ($feePercent / 100)), 2)
                            : round($allocBase, 2);

                        $feeAmount = $hasFee
                            ? round($grossAmount - $allocBase, 2)
                            : 0.00;

                        $meta = $p['meta'];
                        $meta = is_array($meta) ? $meta : [];
                        $meta['group_id'] = $groupId;
                        $meta['group_payment_index'] = $p['src_index'];

                        $appt->payments()->create([
                            'method'       => $method,
                            'base_amount'  => number_format($allocBase, 2, '.', ''),
                            'fee_percent'  => $hasFee ? number_format($feePercent, 2, '.', '') : '0.00',
                            'fee_amount'   => number_format($feeAmount, 2, '.', ''),
                            'amount'       => number_format($grossAmount, 2, '.', ''),
                            'card_brand'   => $p['card_brand'] ?? null,
                            'installments' => $p['installments'] ?? null,
                            'meta'         => $meta,
                        ]);

                        if ($grossAmount > 0) {
                            $customerName = $appt->customer?->name ?? "Cliente";

                            CashierTransaction::create([
                                'date'           => $cashierDate,
                                'type'           => TransactionType::Income,
                                'category'       => 'Atendimentos',
                                'description'    => "Pré-pago (grupo) agendamento #{$appt->id} - {$customerName}",
                                'amount'         => number_format($grossAmount, 2, '.', ''),
                                'payment_method' => $method,
                                'reference'      => $groupRef,
                                'user_id'        => Auth::id(),
                                'notes'          => 'PREPAID_GROUP',
                            ]);
                        }

                        $apptRemaining[$appt->id] -= $allocBaseCents;
                        $baseLeftCents -= $allocBaseCents;
                    }
                }

                foreach ($appointments as $appt) {
                    $calc = $expectedByAppointment[$appt->id];
                    $subtotal = (float) ($calc['subtotal'] ?? 0);
                    $expectedBaseCents = (int) ($calc['expected_base_cents'] ?? 0);

                    $appt->unsetRelation('payments');
                    $appt->load('payments');

                    $sumBaseCents = $appt->payments->sum(fn($pay) => $toCents((float) $pay->base_amount));
                    $sumAmountCents = $appt->payments->sum(fn($pay) => $toCents((float) $pay->amount));

                    if ($sumBaseCents > ($expectedBaseCents + 1)) {
                        $got = number_format($sumBaseCents / 100, 2, ',', '.');
                        $exp = number_format($expectedBaseCents / 100, 2, ',', '.');
                        throw ValidationException::withMessages([
                            'payments' => "Rateio inválido: agendamento #{$appt->id} recebeu acima do líquido. Recebido: R$ {$got} • Esperado: R$ {$exp}.",
                        ]);
                    }

                    $status = $sumBaseCents <= 0
                        ? AppointmentPaymentStatus::Unpaid->value
                        : (($sumBaseCents + 1) >= $expectedBaseCents
                            ? AppointmentPaymentStatus::Paid->value
                            : AppointmentPaymentStatus::Partial->value);

                    $appt->total_price    = number_format($toCents($subtotal) / 100, 2, '.', '');
                    $appt->final_price    = number_format($sumAmountCents / 100, 2, '.', '');
                    $appt->payment_status = $status;
                    $appt->save();
                }

                Log::info('PREPAY GROUP COMPLETED', [
                    'group_id' => $groupId,
                    'appointments' => $appointments->pluck('id')->values()->all(),
                    'cashier_date' => $cashierDate,
                    'expected_group_base' => number_format($expectedGroupBaseCents / 100, 2, '.', ''),
                    'received_group_base' => number_format($sumReceivedBaseCents / 100, 2, '.', ''),
                    'intent' => $intent,
                ]);
            });

        } catch (\Throwable $e) {
            Log::error('PREPAY GROUP FAILED', [
                'group_id' => $groupId ?? null,
                'message'  => $e->getMessage(),
                'file'     => $e->getFile(),
                'line'     => $e->getLine(),
            ]);

            throw $e;
        }

        $appointments = Appointment::query()
            ->where('group_id', $groupId)
            ->with([
                'customer',
                'items',
                'payments',
                'appointmentServices.service',
                'appointmentServices.promotions',
            ])
            ->orderByRaw('COALESCE(group_sequence, 9999) asc')
            ->orderBy('date')
            ->orderBy('start_time')
            ->orderBy('id')
            ->get();

        return AppointmentResource::collection($appointments)
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

    private function assertServicePromotionsApplicableOrFail(array $servicesPayload, ?string $appliedOnYmd = null): void
    {
        $appliedOnYmd = $appliedOnYmd ?: now()->toDateString();
        $date = Carbon::parse($appliedOnYmd);

        $errors = [];

        foreach ($servicesPayload as $sIndex => $service) {
            $serviceId = $service['service_id'] ?? $service['id'] ?? null;
            if (!$serviceId) continue;

            if (!array_key_exists('promotions', $service)) {
                continue;
            }

            $promos = (array) ($service['promotions'] ?? []);
            if (empty($promos)) continue;

            $seen = [];
            foreach ($promos as $pIndex => $p) {
                $pid = $p['promotion_id'] ?? $p['id'] ?? null;
                if (!$pid) continue;

                $pid = (int) $pid;
                if (isset($seen[$pid])) {
                    $errors["services.$sIndex.promotions"][] = 'Promoção duplicada no mesmo serviço.';
                    continue;
                }
                $seen[$pid] = true;

                $promo = Promotion::query()
                    ->with(['services:id', 'items:id'])
                    ->find($pid);

                if (!$promo) {
                    $errors["services.$sIndex.promotions.$pIndex.id"][] = 'Promoção não encontrada.';
                    continue;
                }

                $ok = $this->promotionApplicability->isApplicable($promo, $date, [(int) $serviceId], []);

                if (!$ok) {
                    $errors["services.$sIndex.promotions.$pIndex.id"][] =
                        'Esta promoção não é aplicável para este serviço (na data de aplicação).';
                }
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }
}
