<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use App\Services\SupplierService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class SupplierController extends Controller
{
    public function __construct(private readonly SupplierService $service)
    {
    }

    public function index(Request $request)
    {
        $suppliers = $this->service->paginate($request->all());

        return SupplierResource::collection($suppliers);
    }

    public function store(Request $request)
    {
        $data = Arr::only($request->all(), [
            'name',
            'trade_name',
            'cnpj',
            'email',
            'phone',
            'address',
            'city',
            'state',
            'zip_code',
            'contact_person',
            'payment_terms',
            'notes',
        ]);

        $supplier = $this->service->create($data);

        return (new SupplierResource($supplier))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Supplier $supplier)
    {
        return new SupplierResource($supplier);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $data = Arr::only($request->all(), [
            'name',
            'trade_name',
            'cnpj',
            'email',
            'phone',
            'address',
            'city',
            'state',
            'zip_code',
            'contact_person',
            'payment_terms',
            'notes',
        ]);

        $updated = $this->service->update($supplier, $data);

        return new SupplierResource($updated);
    }

    public function destroy(Supplier $supplier)
    {
        $this->service->delete($supplier);

        return response()->noContent();
    }
}
