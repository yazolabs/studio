<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $appointments = Appointment::with(['customer', 'professionals', 'services', 'items', 'promotion'])
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
        $this->syncProfessionals($appointment, $request->input('professionals', []));

        $totalDuration = $appointment->services()->sum('duration');
        $appointment->update(['duration' => $totalDuration]);

        return (new AppointmentResource(
            $appointment->load(['customer', 'professionals', 'services', 'items', 'promotion'])
        ))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Appointment $appointment)
    {
        return new AppointmentResource(
            $appointment->load(['customer', 'professionals', 'services', 'items', 'promotion'])
        );
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

        if ($request->has('professionals')) {
            $this->syncProfessionals($appointment, $request->input('professionals', []));
        }

        $totalDuration = $appointment->services()->sum('duration');
        $appointment->update(['duration' => $totalDuration]);

        return new AppointmentResource(
            $appointment->load(['customer', 'professionals', 'services', 'items', 'promotion'])
        );
    }

    public function destroy(Appointment $appointment)
    {
        if ($appointment->status === 'completed') {
            return response()->json([
                'message' => 'Não é possível excluir um agendamento já concluído.'
            ], 422);
        }

        $appointment->services()->detach();
        $appointment->items()->detach();
        $appointment->professionals()->detach();
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

            $pivotData[$serviceId] = [
                'service_price' => $service['service_price'] ?? $service['price'] ?? 0,
                'commission_type' => $service['commission_type'] ?? $service['commissionType'] ?? null,
                'commission_value' => $service['commission_value'] ?? $service['commissionValue'] ?? 0,
                'professional_id' => $service['professional_id'] ?? $service['professionalId'] ?? null,
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

    private function syncProfessionals(Appointment $appointment, $professionals): void
    {
        $pivotData = [];

        foreach ((array) $professionals as $professional) {
            $professionalId = $professional['professional_id'] ?? $professional['id'] ?? null;
            if (!$professionalId) {
                continue;
            }

            $pivotData[$professionalId] = [
                'commission_percentage' => $professional['commission_percentage'] ?? null,
                'commission_fixed' => $professional['commission_fixed'] ?? null,
            ];
        }

        $appointment->professionals()->sync($pivotData);
    }

    public function calendar(Request $request)
    {
        $query = Appointment::with(['customer', 'professionals', 'services'])
            ->when($request->filled('professional_id'), function ($q) use ($request) {
                $q->whereHas('professionals', fn($sub) =>
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
}
