<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CashierTransactionResource;
use App\Models\CashierTransaction;
use App\Services\CashierTransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class CashierTransactionController extends Controller
{
    public function __construct(private readonly CashierTransactionService $service)
    {
    }

    public function index(Request $request)
    {
        $query = CashierTransaction::query();

        if ($request->filled('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term) {
                $q->where('description', 'like', "%{$term}%")
                ->orWhere('category', 'like', "%{$term}%")
                ->orWhere('reference', 'like', "%{$term}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('startDate')) {
            $query->whereDate('date', '>=', $request->input('startDate'));
        }

        if ($request->filled('endDate')) {
            $query->whereDate('date', '<=', $request->input('endDate'));
        }

        return $query->orderByDesc('date')->orderByDesc('id')->get();
    }

    public function store(Request $request)
    {
        $payload = Arr::only($request->all(), [
            'date',
            'type',
            'category',
            'description',
            'amount',
            'payment_method',
            'reference',
            'user_id',
            'notes',
        ]);

        $transaction = $this->service->create($payload);

        return (new CashierTransactionResource($transaction))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(CashierTransaction $cashierTransaction)
    {
        return new CashierTransactionResource($cashierTransaction);
    }

    public function update(Request $request, CashierTransaction $cashierTransaction)
    {
        $payload = Arr::only($request->all(), [
            'date',
            'type',
            'category',
            'description',
            'amount',
            'payment_method',
            'reference',
            'user_id',
            'notes',
        ]);

        $updated = $this->service->update($cashierTransaction, $payload);

        return new CashierTransactionResource($updated);
    }

    public function destroy(CashierTransaction $cashierTransaction)
    {
        $this->service->delete($cashierTransaction);

        return response()->noContent();
    }
}
