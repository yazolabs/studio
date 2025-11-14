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
        $filters = $request->only([
            'status',
            'professional_id',
            'appointment_id',
            'start_date',
            'end_date',
            'search',
            'perPage',
        ]);

        $query = Commission::with(['professional', 'customer', 'service', 'appointment'])
            ->when($filters['status'] ?? null, fn($q, $status) => $q->where('status', $status))
            ->when($filters['professional_id'] ?? null, fn($q, $id) => $q->where('professional_id', $id))
            ->when($filters['appointment_id'] ?? null, fn($q, $id) => $q->where('appointment_id', $id))
            ->when(($filters['start_date'] ?? null) && ($filters['end_date'] ?? null), function ($q) use ($filters) {
                $q->whereBetween('date', [
                    $filters['start_date'],
                    $filters['end_date']
                ]);
            })
            ->when($filters['search'] ?? null, function ($q, $term) {
                $q->where(function ($sub) use ($term) {
                    $sub->orWhereHas('professional', fn($rel) => $rel->where('name', 'like', "%{$term}%"))
                        ->orWhereHas('customer', fn($rel) => $rel->where('name', 'like', "%{$term}%"))
                        ->orWhereHas('service', fn($rel) => $rel->where('name', 'like', "%{$term}%"));
                });
            })
            ->orderByDesc('date');

        $commissions = $query->paginate($filters['perPage'] ?? 15);

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

        return (new CommissionResource($commission->load(['professional', 'customer', 'service', 'appointment'])))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Commission $commission)
    {
        return new CommissionResource($commission->load(['professional', 'customer', 'service', 'appointment']));
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

        return new CommissionResource($updated->load(['professional', 'customer', 'service', 'appointment']));
    }

    public function destroy(Commission $commission)
    {
        $this->service->delete($commission);

        return response()->noContent();
    }

    public function markAsPaid(Commission $commission)
    {
        $commission->update([
            'status' => 'paid',
            'payment_date' => now()->toDateString(),
        ]);

        if ($commission->accountPayable) {
            $commission->accountPayable->update([
                'status' => 'paid',
                'payment_date' => now()->toDateString(),
            ]);
        }

        return new CommissionResource($commission->fresh(['professional', 'customer', 'service', 'appointment', 'accountPayable']));
    }
}
