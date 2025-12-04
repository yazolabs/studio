<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use App\Services\ServiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class ServiceController extends Controller
{
    public function __construct(private readonly ServiceService $service)
    {
    }

    public function index(Request $request)
    {
        $query = Service::query()->orderBy('name');

        if ($search = trim($request->get('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($category = $request->get('category')) {
            $query->where('category', $category);
        }

        if (!is_null($request->get('active'))) {
            $active = filter_var(
                $request->get('active'),
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if (!is_null($active)) {
                $query->where('active', $active);
            }
        }

        if ($commissionType = $request->get('commission_type')) {
            $query->where('commission_type', $commissionType);
        }

        if ($minPrice = $request->get('min_price')) {
            $query->where('price', '>=', $minPrice);
        }

        if ($maxPrice = $request->get('max_price')) {
            $query->where('price', '<=', $maxPrice);
        }

        $services = $query->get();

        return ServiceResource::collection($services);
    }

    public function store(Request $request)
    {
        $data = Arr::only($request->all(), [
            'name',
            'description',
            'price',
            'duration',
            'category',
            'commission_type',
            'commission_value',
            'active',
        ]);

        $service = $this->service->create($data);

        return (new ServiceResource($service))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Service $service)
    {
        return new ServiceResource($service);
    }

    public function update(Request $request, Service $service)
    {
        $data = Arr::only($request->all(), [
            'name',
            'description',
            'price',
            'duration',
            'category',
            'commission_type',
            'commission_value',
            'active',
        ]);

        $updated = $this->service->update($service, $data);

        return new ServiceResource($updated);
    }

    public function destroy(Service $service)
    {
        $this->service->delete($service);

        return response()->noContent();
    }
}
