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
        $services = $this->service->paginate($request->all());

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
