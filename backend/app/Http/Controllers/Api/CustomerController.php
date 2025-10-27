<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Services\CustomerService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class CustomerController extends Controller
{
    public function __construct(private readonly CustomerService $service)
    {
    }

    public function index(Request $request)
    {
        $customers = $this->service->paginate($request->all());

        return CustomerResource::collection($customers);
    }

    public function store(Request $request)
    {
        $data = Arr::only($request->all(), [
            'name',
            'email',
            'phone',
            'alternate_phone',
            'address',
            'city',
            'state',
            'zip_code',
            'birth_date',
            'notes',
            'last_visit',
        ]);

        $customer = $this->service->create($data);

        return (new CustomerResource($customer))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Customer $customer)
    {
        return new CustomerResource($customer);
    }

    public function update(Request $request, Customer $customer)
    {
        $data = Arr::only($request->all(), [
            'name',
            'email',
            'phone',
            'alternate_phone',
            'address',
            'city',
            'state',
            'zip_code',
            'birth_date',
            'notes',
            'last_visit',
        ]);

        $updated = $this->service->update($customer, $data);

        return new CustomerResource($updated);
    }

    public function destroy(Customer $customer)
    {
        $this->service->delete($customer);

        return response()->noContent();
    }
}
