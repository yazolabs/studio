<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AccountPayableResource;
use App\Models\{AccountPayable, CashierTransaction, Commission};
use App\Services\AccountPayableService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class AccountPayableController extends Controller
{
    public function __construct(private readonly AccountPayableService $service) {}

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
        ]);

        $query = AccountPayable::query()
            ->with(['professional', 'appointment'])
            ->where(function ($q) {
                $q->whereNull('origin_type')
                ->orWhere('origin_type', 'commission');
            })
            ->with(['origin' => function ($morphTo) {
                $morphTo->morphWith([
                    Commission::class => [],
                ]);
            }])
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['category'] ?? null, fn ($q, $cat) => $q->where('category', 'like', "%{$cat}%"))
            ->when($filters['professional_id'] ?? null, fn ($q, $id) => $q->where('professional_id', $id))
            ->when($filters['appointment_id'] ?? null, fn ($q, $id) => $q->where('appointment_id', $id))
            ->when(
                ($filters['start_date'] ?? null) && ($filters['end_date'] ?? null),
                fn ($q) => $q->whereBetween('due_date', [$filters['start_date'], $filters['end_date']])
            )
            ->when($filters['search'] ?? null, function ($q, $term) {
                $q->where(function ($sub) use ($term) {
                    $sub->where('description', 'like', "%{$term}%")
                        ->orWhere('category', 'like', "%{$term}%")
                        ->orWhere('reference', 'like', "%{$term}%");
                });
            })
            ->orderByDesc('due_date');

        return AccountPayableResource::collection($query->get());
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
            'origin_type',
            'origin_id',
            'payment_date',
            'payment_method',
            'reference',
            'notes',
        ]);

        $account = $this->service->create($payload);

        return (new AccountPayableResource(
            $account->load(['professional', 'appointment', 'origin'])
        ))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(AccountPayable $accountPayable)
    {
        return new AccountPayableResource(
            $accountPayable->load(['professional', 'appointment', 'origin'])
        );
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
            'origin_type',
            'origin_id',
            'payment_date',
            'payment_method',
            'reference',
            'notes',
        ]);

        $updated = $this->service->update($accountPayable, $payload);

        return new AccountPayableResource(
            $updated->load(['professional', 'appointment', 'origin'])
        );
    }

    public function destroy(AccountPayable $accountPayable)
    {
        $this->service->delete($accountPayable);
        return response()->noContent();
    }

    public function markAsPaid(Request $request, AccountPayable $accountPayable)
    {
        $payload = $request->validate([
            'payment_method' => ['required', 'string', 'max:50'],
            'payment_date'   => ['required', 'date'],
        ]);

        $updated = $this->service->update($accountPayable, [
            'status'         => 'paid',
            'payment_method' => $payload['payment_method'],
            'payment_date'   => $payload['payment_date'],
        ]);

        $ref = $updated->reference ?: "AP-{$updated->id}";

        CashierTransaction::firstOrCreate(
            [
                'type'      => 'saida',
                'reference' => $ref,
            ],
            [
                'date'           => $payload['payment_date'],
                'category'       => $updated->category ?: 'Contas a pagar',
                'description'    => $updated->description ?: "Conta paga #{$updated->id}",
                'amount'         => $updated->amount,
                'payment_method' => $payload['payment_method'],
                'user_id'        => $request->user()?->id,
                'notes'          => $updated->notes,
            ]
        );

        return new AccountPayableResource(
            $updated->fresh(['professional', 'appointment', 'origin'])
        );
    }
}
