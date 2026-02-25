<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isProfessional = $user?->hasRole('professional') === true;

        $query = Customer::query()
            ->when($isProfessional, fn ($q) => $q->select(['id', 'name']))
            ->orderBy('name');

        if ($search = trim((string) $request->get('search', ''))) {
            $query->where(function ($q) use ($search, $isProfessional) {
                $q->where('name', 'like', "%{$search}%");

                if (!$isProfessional) {
                    $q->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                }
            });
        }

        $customers = $query->get();

        return CustomerResource::collection($customers);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:160',
            'cpf' => 'nullable|string|max:20',
            'gender' => 'nullable|string|max:20',
            'active' => 'boolean',
            'email' => 'nullable|email|max:160',
            'phone' => 'required|string|max:40',
            'alternate_phone' => 'nullable|string|max:40',
            'address' => 'nullable|string|max:255',
            'number' => 'nullable|string|max:20',
            'complement' => 'nullable|string|max:120',
            'neighborhood' => 'nullable|string|max:120',
            'city' => 'nullable|string|max:120',
            'state' => 'nullable|string|max:60',
            'zip_code' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date',
            'last_visit' => 'nullable|date',
            'notes' => 'nullable|string',
            'contact_preferences' => 'nullable|array',
            'accepts_marketing' => 'boolean',
        ]);

        $customer = Customer::create($data);

        return (new CustomerResource($customer))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Request $request, Customer $customer)
    {
        $user = $request->user();
        $isProfessional = $user?->hasRole('professional') === true;

        if ($isProfessional) {
            $customer = Customer::query()
                ->select(['id', 'name'])
                ->whereKey($customer->id)
                ->firstOrFail();
        }

        return new CustomerResource($customer);
    }

    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:160',
            'cpf' => 'nullable|string|max:20',
            'gender' => 'nullable|string|max:20',
            'active' => 'boolean',
            'email' => 'nullable|email|max:160',
            'phone' => 'required|string|max:40',
            'alternate_phone' => 'nullable|string|max:40',
            'address' => 'nullable|string|max:255',
            'number' => 'nullable|string|max:20',
            'complement' => 'nullable|string|max:120',
            'neighborhood' => 'nullable|string|max:120',
            'city' => 'nullable|string|max:120',
            'state' => 'nullable|string|max:60',
            'zip_code' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date',
            'last_visit' => 'nullable|date',
            'notes' => 'nullable|string',
            'contact_preferences' => 'nullable|array',
            'accepts_marketing' => 'boolean',
        ]);

        $customer->update($data);

        return new CustomerResource($customer);
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return response()->json([
            'message' => 'Cliente excluído com sucesso.'
        ], Response::HTTP_NO_CONTENT);
    }
}
