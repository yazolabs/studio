<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfessionalResource;
use App\Models\Professional;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class ProfessionalController extends Controller
{
    public function index(Request $request)
    {
        $query = Professional::with('user')->orderBy('id', 'desc');

        if ($search = trim($request->get('search', ''))) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = min(100, max(1, (int) $request->get('per_page', 10)));
        $professionals = $query->paginate($perPage)->appends($request->all());

        return ProfessionalResource::collection($professionals);
    }

    public function store(Request $request)
    {
        $raw = $request->getContent();
        $json = json_decode($raw, true);
        if (is_array($json)) {
            $request->merge($json);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'phone'   => 'nullable|string|max:40',
            'specialties' => 'nullable|array',
            'active'  => 'boolean',
            'work_schedule' => 'present|array',
        ]);

        $validated['work_schedule'] = array_values($validated['work_schedule']);

        $professional = Professional::create($validated);
        $professional->load('user');

        return response()->json([
            'message' => 'Profissional criado com sucesso.',
            'professional' => new ProfessionalResource($professional),
        ], Response::HTTP_CREATED);
    }

    public function show(Professional $professional)
    {
        $professional->load('user');
        return new ProfessionalResource($professional);
    }

    public function update(Request $request, Professional $professional)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'sometimes|exists:users,id',
            'phone' => 'nullable|string|max:40',
            'specialties' => 'nullable|array',
            'active' => 'boolean',
            'work_schedule' => 'array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erro de validação.',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $data = $validator->validated();

        if (isset($data['work_schedule']) && is_array($data['work_schedule'])) {
            $data['work_schedule'] = array_values($data['work_schedule']);
        }

        $professional->update($data);
        $professional->load('user');

        return response()->json([
            'message' => 'Profissional atualizado com sucesso.',
            'professional' => new ProfessionalResource($professional),
        ]);
    }

    public function destroy(Professional $professional)
    {
        $professional->delete();

        return response()->json([
            'message' => 'Profissional excluído com sucesso.'
        ], Response::HTTP_NO_CONTENT);
    }
}
