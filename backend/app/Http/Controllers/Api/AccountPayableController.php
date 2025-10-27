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
        $records = $this->service->paginate($request->all());

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

        return (new AccountPayableResource($account))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(AccountPayable $accountPayable)
    {
        return new AccountPayableResource($accountPayable);
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

        return new AccountPayableResource($updated);
    }

    public function destroy(AccountPayable $accountPayable)
    {
        $this->service->delete($accountPayable);

        return response()->noContent();
    }
}
