<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfessionalResource;
use App\Models\Professional;
use App\Services\ProfessionalService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class ProfessionalController extends Controller
{
    public function __construct(private readonly ProfessionalService $service)
    {
    }

    public function index(Request $request)
    {
        $professionals = $this->service->paginate($request->all());

        return ProfessionalResource::collection($professionals);
    }

    public function store(Request $request)
    {
        $data = Arr::only($request->all(), [
            'name',
            'email',
            'phone',
            'specialties',
            'active',
            'work_schedule',
        ]);

        $professional = $this->service->create($data);

        return (new ProfessionalResource($professional))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Professional $professional)
    {
        return new ProfessionalResource($professional);
    }

    public function update(Request $request, Professional $professional)
    {
        $data = Arr::only($request->all(), [
            'name',
            'email',
            'phone',
            'specialties',
            'active',
            'work_schedule',
        ]);

        $updated = $this->service->update($professional, $data);

        return new ProfessionalResource($updated);
    }

    public function destroy(Professional $professional)
    {
        $this->service->delete($professional);

        return response()->noContent();
    }
}
