<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Screen;
use Illuminate\Http\{JsonResponse, Request};

class ScreenController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Screen::with('permissions')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:screens,slug',
        ]);

        $screen = Screen::create($validated);

        return response()->json([
            'message' => 'Tela criada com sucesso.',
            'screen' => $screen
        ], 201);
    }

    public function show(Screen $screen): JsonResponse
    {
        $screen->load('permissions');

        return response()->json($screen);
    }

    public function update(Request $request, Screen $screen): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'slug' => 'sometimes|required|string|max:100|unique:screens,slug,' . $screen->id,
        ]);

        $screen->update($validated);

        return response()->json([
            'message' => 'Tela atualizada com sucesso.',
            'screen' => $screen
        ]);
    }

    public function destroy(Screen $screen): JsonResponse
    {
        $screen->delete();

        return response()->json([
            'message' => 'Tela excluída com sucesso.'
        ], 204);
    }
}
