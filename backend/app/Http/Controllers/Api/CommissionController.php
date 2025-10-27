<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommissionResource;
use App\Models\Commission;
use App\Services\CommissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class CommissionController extends Controller
{
    public function __construct(private readonly CommissionService $service)
    {
    }

    public function index(Request $request)
    {
        $commissions = $this->service->paginate($request->all());

        return CommissionResource::collection($commissions);
    }

    public function store(Request $request)
    {
        $payload = Arr::only($request->all(), [
            'professional_id',
            'appointment_id',
            'service_id',
            'customer_id',
            'date',
            'service_price',
            'commission_type',
            'commission_value',
            'commission_amount',
            'status',
            'payment_date',
        ]);

        $commission = $this->service->create($payload);

        return (new CommissionResource($commission->load(['professional', 'customer', 'service'])))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Commission $commission)
    {
        return new CommissionResource($commission->load(['professional', 'customer', 'service']));
    }

    public function update(Request $request, Commission $commission)
    {
        $payload = Arr::only($request->all(), [
            'professional_id',
            'appointment_id',
            'service_id',
            'customer_id',
            'date',
            'service_price',
            'commission_type',
            'commission_value',
            'commission_amount',
            'status',
            'payment_date',
        ]);

        $updated = $this->service->update($commission, $payload);

        return new CommissionResource($updated->load(['professional', 'customer', 'service']));
    }

    public function destroy(Commission $commission)
    {
        $this->service->delete($commission);

        return response()->noContent();
    }
}
