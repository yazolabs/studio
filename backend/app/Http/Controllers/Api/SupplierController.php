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
        $filters = $request->only([
            'search',
            'city',
            'state',
        ]);

        $query = Supplier::query()
            ->when($filters['search'] ?? null, function ($q, $term) {
                $q->where(function ($sub) use ($term) {
                    $sub->where('name', 'like', "%{$term}%")
                        ->orWhere('trade_name', 'like', "%{$term}%")
                        ->orWhere('cnpj', 'like', "%{$term}%")
                        ->orWhere('cpf', 'like', "%{$term}%")
                        ->orWhere('email', 'like', "%{$term}%");
                });
            })
            ->when($filters['city'] ?? null, fn ($q, $city) =>
                $q->where('city', 'like', "%{$city}%")
            )
            ->when($filters['state'] ?? null, fn ($q, $state) =>
                $q->where('state', 'like', "%{$state}%")
            )
            ->orderBy('name');

        $suppliers = $query->get();

        return SupplierResource::collection($suppliers);
    }

    public function store(Request $request)
    {
        $data = Arr::only($request->all(), [
            'name',
            'trade_name',
            'cnpj',
            'cpf',
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

        $existing = null;

        if (!empty($data['cpf'])) {
            $existing = Supplier::withTrashed()
                ->where('cpf', $data['cpf'])
                ->first();
        }

        if (!$existing && !empty($data['cnpj'])) {
            $existing = Supplier::withTrashed()
                ->where('cnpj', $data['cnpj'])
                ->first();
        }

        if ($existing) {
            $existing->fill($data);

            if ($existing->trashed()) {
                $existing->restore();
            }

            $existing->save();

            return (new SupplierResource($existing))
                ->response()
                ->setStatusCode(Response::HTTP_OK);
        }

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
            'cpf',
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
