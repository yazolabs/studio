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
        $transactions = $this->service->paginate($request->all());

        return CashierTransactionResource::collection($transactions);
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
