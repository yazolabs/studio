<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AccountPayableResource;
use App\Models\AccountPayable;
use App\Services\AccountPayableService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class AccountPayableController extends Controller
{
    public function __construct(private readonly AccountPayableService $service)
    {
    }

    public function index(Request $request)
    {
        $filters = $request->only([
            'status',
            'category',
            'professional_id',
            'appointment_id',
            'start_date',
            'end_date',
            'search',
            // removido: 'perPage',
        ]);

        $query = AccountPayable::with(['professional', 'appointment', 'commission'])
            ->when($filters['status'] ?? null, fn($q, $status) => $q->where('status', $status))
            ->when($filters['category'] ?? null, fn($q, $cat) => $q->where('category', 'like', "%{$cat}%"))
            ->when($filters['professional_id'] ?? null, fn($q, $id) => $q->where('professional_id', $id))
            ->when($filters['appointment_id'] ?? null, fn($q, $id) => $q->where('appointment_id', $id))
            ->when(
                ($filters['start_date'] ?? null) && ($filters['end_date'] ?? null),
                function ($q) use ($filters) {
                    $q->whereBetween('due_date', [$filters['start_date'], $filters['end_date']]);
                }
            )
            ->when($filters['search'] ?? null, function ($q, $term) {
                $q->where(function ($sub) use ($term) {
                    $sub->where('description', 'like', "%{$term}%")
                        ->orWhere('category', 'like', "%{$term}%")
                        ->orWhere('reference', 'like', "%{$term}%");
                });
            })
            ->orderByDesc('due_date');

        $records = $query->get();

        return AccountPayableResource::collection($records);
    }

    public function store(Request $request)
    {
        $payload = Arr::only($request->all(), [
            'description',
            'amount',
            'due_date',
            'status',
            'category',
            'supplier_id',
            'professional_id',
            'appointment_id',
            'payment_date',
            'payment_method',
            'reference',
            'notes',
        ]);

        $account = $this->service->create($payload);

        return (new AccountPayableResource($account->load(['professional', 'appointment', 'commission'])))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(AccountPayable $accountPayable)
    {
        return new AccountPayableResource($accountPayable->load(['professional', 'appointment', 'commission']));
    }

    public function update(Request $request, AccountPayable $accountPayable)
    {
        $payload = Arr::only($request->all(), [
            'description',
            'amount',
            'due_date',
            'status',
            'category',
            'supplier_id',
            'professional_id',
            'appointment_id',
            'payment_date',
            'payment_method',
            'reference',
            'notes',
        ]);

        $updated = $this->service->update($accountPayable, $payload);

        return new AccountPayableResource($updated->load(['professional', 'appointment', 'commission']));
    }

    public function destroy(AccountPayable $accountPayable)
    {
        $this->service->delete($accountPayable);

        return response()->noContent();
    }

    public function markAsPaid(AccountPayable $accountPayable)
    {
        $accountPayable->update([
            'status' => 'paid',
            'payment_date' => now()->toDateString(),
        ]);

        if ($accountPayable->commission) {
            $accountPayable->commission->update([
                'status' => 'paid',
                'payment_date' => now()->toDateString(),
            ]);
        }

        return new AccountPayableResource($accountPayable->fresh(['professional', 'appointment', 'commission']));
    }
}
