<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Action;
use Illuminate\Http\{JsonResponse, Request};

class ActionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Action::with('permissions')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:actions,slug',
        ]);

        $action = Action::create($validated);

        return response()->json([
            'message' => 'Ação criada com sucesso.',
            'action' => $action
        ], 201);
    }

    public function show(Action $action): JsonResponse
    {
        $action->load('permissions');

        return response()->json($action);
    }

    public function update(Request $request, Action $action): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'slug' => 'sometimes|required|string|max:100|unique:actions,slug,' . $action->id,
        ]);

        $action->update($validated);

        return response()->json([
            'message' => 'Ação atualizada com sucesso.',
            'action' => $action
        ]);
    }

    public function destroy(Action $action): JsonResponse
    {
        $action->delete();

        return response()->json([
            'message' => 'Ação excluída com sucesso.'
        ], 204);
    }
}
