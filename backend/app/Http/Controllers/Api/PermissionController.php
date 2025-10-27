<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\{JsonResponse, Request};

class PermissionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Permission::with(['role', 'screen', 'action'])->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role_id'   => 'required|exists:roles,id',
            'screen_id' => 'required|exists:screens,id',
            'action_id' => 'required|exists:actions,id',
        ]);

        $exists = Permission::where($validated)->exists();
        if ($exists) {
            return response()->json([
                'message' => 'Permissão já existe.'
            ], 409);
        }

        $permission = Permission::create($validated);

        return response()->json([
            'message' => 'Permissão criada com sucesso.',
            'permission' => $permission
        ], 201);
    }

    public function show(Permission $permission): JsonResponse
    {
        $permission->load(['role', 'screen', 'action']);

        return response()->json($permission);
    }

    public function update(Request $request, Permission $permission): JsonResponse
    {
        $validated = $request->validate([
            'role_id'   => 'sometimes|required|exists:roles,id',
            'screen_id' => 'sometimes|required|exists:screens,id',
            'action_id' => 'sometimes|required|exists:actions,id',
        ]);

        $permission->update($validated);

        return response()->json([
            'message' => 'Permissão atualizada com sucesso.',
            'permission' => $permission
        ]);
    }

    public function destroy(Permission $permission): JsonResponse
    {
        $permission->delete();

        return response()->json([
            'message' => 'Permissão excluída com sucesso.'
        ], 204);
    }
}
