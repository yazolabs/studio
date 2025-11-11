<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\{Appointment, Service};
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
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
                'price' => $item['price'] ?? 0,
                'quantity' => $item['quantity'] ?? 1,
            ];
        }

        $appointment->items()->sync($pivotData);
    }

    public function calendar(Request $request)
    {
        $query = Appointment::with(['customer', 'services'])
            ->when($request->filled('professional_id'), function ($q) use ($request) {
                $q->whereHas('services', fn($sub) =>
                    $sub->where('professional_id', $request->professional_id)
                );
            })
            ->when($request->filled('status'), fn($q) =>
                $q->where('status', $request->status)
            )
            ->when($request->filled('start_date') && $request->filled('end_date'), fn($q) =>
                $q->whereBetween('date', [$request->start_date, $request->end_date])
            )
            ->when($request->filled('date') && !$request->filled('start_date'), fn($q) =>
                $q->whereDate('date', $request->date)
            )
            ->orderBy('date')
            ->orderBy('start_time');

        return AppointmentResource::collection($query->get());
    }

    public function checkout(Request $request, Appointment $appointment)
    {
        $data = $request->validate([
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['required', 'string', 'max:50'],
            'card_brand' => ['nullable', 'string', 'max:50'],
            'installments' => ['nullable', 'integer', 'min:1'],
            'installment_fee' => ['nullable', 'numeric', 'min:0'],
            'promotion_id' => ['nullable', 'exists:promotions,id'],
        ]);

        $appointment->fill($data);

        if (!$appointment->end_time) {
            $appointment->end_time = now();
        }

        if ($appointment->status !== 'completed') {
            $appointment->status = 'completed';
        }

        $appointment->final_price = 
            ($appointment->total_price + ($appointment->installment_fee ?? 0))
            - ($appointment->discount_amount ?? 0);

        $appointment->save();

        $appointment->load(['customer', 'services', 'items', 'promotion']);

        return (new AppointmentResource($appointment))
            ->response()
            ->setStatusCode(Response::HTTP_OK);
    }
}
