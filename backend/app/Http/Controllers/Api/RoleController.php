<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\{JsonResponse, Request};

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Role::with('permissions')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:roles,slug',
        ]);

        $role = Role::create($validated);

        return response()->json([
            'message' => 'Perfil criado com sucesso.',
            'role' => $role
        ], 201);
    }

    public function show(Role $role): JsonResponse
    {
        $role->load('permissions');

        return response()->json($role);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'slug' => 'sometimes|required|string|max:100|unique:roles,slug,' . $role->id,
        ]);

        $role->update($validated);

        return response()->json([
            'message' => 'Perfil atualizado com sucesso.',
            'role' => $role
        ]);
    }

    public function destroy(Role $role): JsonResponse
    {
        $role->delete();

        return response()->json([
            'message' => 'Perfil excluído com sucesso.'
        ], 204);
    }
}
