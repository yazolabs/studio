<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class AppointmentController extends Controller
{
    public function __construct(private readonly AppointmentService $service)
    {
    }

    public function index(Request $request)
    {
        $appointments = $this->service->paginate($request->all());

        return AppointmentResource::collection($appointments);
    }

    public function store(Request $request)
    {
        $payload = Arr::only($request->all(), [
            'customer_id',
            'professional_id',
            'date',
            'start_time',
            'status',
            'total_price',
            'discount_amount',
            'final_price',
            'payment_method',
            'promotion_id',
            'notes',
        ]);

        $appointment = $this->service->create($payload);

        $this->syncServices($appointment, $request->input('services', []));

        return (new AppointmentResource($appointment->load(['customer', 'professional', 'services', 'promotion'])))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Appointment $appointment)
    {
        return new AppointmentResource($appointment->load(['customer', 'professional', 'services', 'promotion']));
    }

    public function update(Request $request, Appointment $appointment)
    {
        $payload = Arr::only($request->all(), [
            'customer_id',
            'professional_id',
            'date',
            'start_time',
            'status',
            'total_price',
            'discount_amount',
            'final_price',
            'payment_method',
            'promotion_id',
            'notes',
        ]);

        $updated = $this->service->update($appointment, $payload);

        if ($request->has('services')) {
            $this->syncServices($updated, $request->input('services', []));
        }

        return new AppointmentResource($updated->load(['customer', 'professional', 'services', 'promotion']));
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->services()->detach();
        $this->service->delete($appointment);

        return response()->noContent();
    }

    private function syncServices(Appointment $appointment, $services): void
    {
        $services = is_array($services) ? $services : [];

        if (empty($services)) {
            $appointment->services()->sync([]);

            return;
        }

        $pivotData = [];

        foreach ($services as $service) {
            $serviceId = $service['service_id'] ?? $service['id'] ?? null;

            if (! $serviceId) {
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
}
