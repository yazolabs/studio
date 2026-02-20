<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommissionResource;
use App\Models\{Commission, AccountPayable};
use App\Services\CommissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
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

        $query = Commission::with(['professional', 'customer', 'service', 'appointment', 'appointmentService', 'accountPayable'])
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
            'appointment_service_id',
            'customer_id',
            'date',
            'service_price',
            'commission_type',
            'commission_value',
            'commission_amount',
            'status',
            'payment_date',
        ]);

        $commission = DB::transaction(function () use ($payload) {
            $created = $this->service->create($payload);
            $this->syncAccountPayableFromCommission($created);
            return $created;
        });

        return (new CommissionResource(
            $commission->load(['professional', 'customer', 'service', 'appointment', 'appointmentService', 'accountPayable'])
        ))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Commission $commission)
    {
        return new CommissionResource(
            $commission->load(['professional', 'customer', 'service', 'appointment', 'appointmentService', 'accountPayable'])
        );
    }

    public function update(Request $request, Commission $commission)
    {
        $payload = Arr::only($request->all(), [
            'professional_id',
            'appointment_id',
            'service_id',
            'appointment_service_id',
            'customer_id',
            'date',
            'service_price',
            'commission_type',
            'commission_value',
            'commission_amount',
            'status',
            'payment_date',
        ]);

        $updated = DB::transaction(function () use ($commission, $payload) {
            $u = $this->service->update($commission, $payload);
            $this->syncAccountPayableFromCommission($u);
            return $u;
        });

        return new CommissionResource(
            $updated->load(['professional', 'customer', 'service', 'appointment', 'appointmentService', 'accountPayable'])
        );
    }

    public function destroy(Commission $commission)
    {
        $this->service->delete($commission);
        return response()->noContent();
    }

    public function markAsPaid(Commission $commission)
    {
        $updated = DB::transaction(function () use ($commission) {
            $u = $this->service->update($commission, [
                'status'       => 'paid',
                'payment_date' => now()->toDateString(),
            ]);

            $this->syncAccountPayableFromCommission($u);
            return $u;
        });

        return new CommissionResource(
            $updated->fresh(['professional', 'customer', 'service', 'appointment', 'appointmentService', 'accountPayable'])
        );
    }

    private function syncAccountPayableFromCommission(Commission $commission): void
    {
        $commission->loadMissing(['service', 'accountPayable']);

        $originType = $commission->getMorphClass();
        $status = is_object($commission->status) ? $commission->status->value : (string) $commission->status;

        $updates = [
            'amount' => (float) $commission->commission_amount,
        ];

        if ($status === 'paid') {
            $updates['status'] = 'paid';
            $updates['payment_date'] = $commission->payment_date ?? now()->toDateString();
        } else {
            $updates['status'] = 'pending';
            $updates['payment_date'] = null;
        }

        $ap = AccountPayable::withTrashed()
            ->where('origin_type', $originType)
            ->where('origin_id', $commission->id)
            ->first();

        if ($ap) {
            if (method_exists($ap, 'trashed') && $ap->trashed()) {
                $ap->restore();
            }

            $ap->update($updates);
            return;
        }

        $serviceName = $commission->service?->name;
        $description = $serviceName ? "Comissão: {$serviceName}" : "Comissão";

        AccountPayable::create([
            'description'     => $description,
            'amount'          => $updates['amount'],
            'due_date'        => now()->addDays(7)->toDateString(),
            'status'          => $updates['status'],
            'category'        => 'Comissões',
            'professional_id' => $commission->professional_id,
            'appointment_id'  => $commission->appointment_id,
            'origin_type'     => $originType,
            'origin_id'       => $commission->id,
            'payment_date'    => $updates['payment_date'],
        ]);
    }
}
