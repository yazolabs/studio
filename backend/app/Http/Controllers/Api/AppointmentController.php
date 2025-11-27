<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\{AccountPayable, Appointment, Commission, Service};
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\{DB, Log};
use Symfony\Component\HttpFoundation\Response;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $appointments = Appointment::with(['customer', 'services', 'items', 'promotion'])
            ->orderByDesc('date')
            ->paginate($request->get('per_page', 15));

        return AppointmentResource::collection($appointments);
    }

    public function store(Request $request)
    {
        $payload = Arr::only($request->all(), [
            'customer_id',
            'date',
            'start_time',
            'end_time',
            'duration',
            'status',
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

        $appointment = Appointment::create($payload);

        $this->syncServices($appointment, $request->input('services', []));
        $this->syncItems($appointment, $request->input('items', []));

        $totalDuration = $appointment->services()->sum('duration');
        $appointment->update(['duration' => $totalDuration]);

        return (new AppointmentResource(
            $appointment->load(['customer', 'services', 'items', 'promotion'])
        ))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Appointment $appointment)
    {
        $appointment->load(['customer', 'services', 'items', 'promotion']);

        return new AppointmentResource($appointment);
    }

    public function update(Request $request, Appointment $appointment)
    {
        $payload = Arr::only($request->all(), [
            'customer_id',
            'date',
            'start_time',
            'end_time',
            'duration',
            'status',
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

        if ($request->has('services')) {
            $this->syncServices($appointment, $request->input('services', []));
        }

        if ($request->has('items')) {
            $this->syncItems($appointment, $request->input('items', []));
        }

        $totalDuration = $appointment->services()->sum('duration');
        $appointment->update(['duration' => $totalDuration]);

        return new AppointmentResource(
            $appointment->load(['customer', 'services', 'items', 'promotion'])
        );
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
        $pivotData = [];

        foreach ((array) $services as $service) {
            $serviceId = $service['service_id'] ?? $service['id'] ?? null;
            if (!$serviceId) {
                continue;
            }

            $serviceModel = Service::find($serviceId);

            $commissionType = !empty($service['commission_type'])
                ? $service['commission_type']
                : ($serviceModel?->commission_type ?? 'percentage');

            $commissionValue = isset($service['commission_value']) && $service['commission_value'] !== null && $service['commission_value'] !== ''
                ? $service['commission_value']
                : ($serviceModel?->commission_value ?? 0);

            $servicePrice = isset($service['service_price']) && $service['service_price'] !== null && $service['service_price'] !== ''
                ? $service['service_price']
                : ($serviceModel?->price ?? 0);

            $pivotData[$serviceId] = [
                'service_price'    => $servicePrice,
                'commission_type'  => $commissionType,
                'commission_value' => $commissionValue,
                'professional_id'  => $service['professional_id'] ?? null,
            ];
        }

        $appointment->services()->sync($pivotData);
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

    public function calendar(Request $request)
    {
        $query = Appointment::with(['customer', 'services'])
            ->when($request->filled('professional_id'), function ($q) use ($request) {
                $q->whereHas('services', fn ($sub) =>
                    $sub->where('professional_id', $request->professional_id)
                );
            })
            ->when($request->filled('status'), fn ($q) =>
                $q->where('status', $request->status)
            )
            ->when($request->filled('start_date') && $request->filled('end_date'), fn ($q) =>
                $q->whereBetween('date', [$request->start_date, $request->end_date])
            )
            ->when($request->filled('date') && !$request->filled('start_date'), fn ($q) =>
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
                Log::info('CHECKOUT STARTED', [
                    'appointment_id'    => $appointment->id,
                    'incoming_data'     => $data,
                    'services_in_pivot' => $appointment->services()->get()->map(function ($s) {
                        return [
                            'service_id'       => $s->id,
                            'professional_id'  => $s->pivot->professional_id,
                            'commission_type'  => $s->pivot->commission_type,
                            'commission_value' => $s->pivot->commission_value,
                            'service_price'    => $s->pivot->service_price,
                        ];
                    })->toArray(),
                ]);

                $appointment->fill($data);

                if (! $appointment->end_time) {
                    $appointment->end_time = now();
                }

                if ($appointment->status !== 'completed') {
                    $appointment->status = 'completed';
                }

                $servicesTotal = $appointment->services->sum(function ($s) {
                    return $s->pivot->service_price;
                });

                $productsTotal = $appointment->items->sum(function ($i) {
                    return $i->pivot->price * $i->pivot->quantity;
                });

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

                $appointment->save();

                $appointment->load(['customer', 'services']);

                $createdCommissions = 0;
                $createdAccounts    = 0;

                foreach ($appointment->services as $service) {
                    $professionalId  = $service->pivot->professional_id;
                    $commissionType  = $service->pivot->commission_type;
                    $commissionValue = $service->pivot->commission_value;
                    $servicePrice    = $service->pivot->service_price;

                    Log::info('CHECKOUT SERVICE PIVOT', [
                        'appointment_id'   => $appointment->id,
                        'service_id'       => $service->id,
                        'professional_id'  => $professionalId,
                        'commission_type'  => $commissionType,
                        'commission_value' => $commissionValue,
                        'service_price'    => $servicePrice,
                    ]);

                    if (! $professionalId) {
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
                        'status'            => 'pending',
                    ]);

                    $createdCommissions++;

                    Log::info('COMMISSION CREATED', [
                        'commission_id'    => $commission->id,
                        'professional_id'  => $professionalId,
                        'appointment_id'   => $appointment->id,
                        'service_id'       => $service->id,
                        'commission_amount'=> $commissionAmount,
                    ]);

                    $account = AccountPayable::create([
                        'description'     => "Comissão: {$service->name}",
                        'amount'          => $commissionAmount,
                        'due_date'        => now()->addDays(7)->toDateString(),
                        'status'          => 'pending',
                        'category'        => 'Comissões',
                        'professional_id' => $professionalId,
                        'appointment_id'  => $appointment->id,
                        'reference'       => "APP-{$appointment->id}-SRV-{$service->id}",
                    ]);

                    $createdAccounts++;

                    Log::info('ACCOUNT PAYABLE CREATED', [
                        'account_id'      => $account->id,
                        'professional_id' => $professionalId,
                        'appointment_id'  => $appointment->id,
                        'amount'          => $commissionAmount,
                    ]);
                }

                Log::info('CHECKOUT COMPLETED', [
                    'appointment_id'      => $appointment->id,
                    'commissions_created' => $createdCommissions,
                    'accounts_created'    => $createdAccounts,
                ]);
            });
        } catch (\Throwable $e) {
            Log::error('CHECKOUT FAILED', [
                'appointment_id' => $appointment->id ?? null,
                'message'        => $e->getMessage(),
                'trace'          => $e->getTraceAsString(),
            ]);

            throw $e;
        }

        return (new AppointmentResource(
            $appointment->load(['customer', 'services', 'items', 'promotion'])
        ))
            ->response()
            ->setStatusCode(Response::HTTP_OK);
    }
}
