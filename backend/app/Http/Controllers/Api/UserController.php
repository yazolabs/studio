<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search   = trim((string) $request->get('search', ''));
        $perPage  = min(100, max(1, (int) $request->get('per_page', 10)));
        $query    = User::with('roles')->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                ->orWhere('username', 'like', "%{$search}%");
            });
        }

        $paginator = $query->paginate($perPage)->appends($request->all());

        return response()->json($paginator);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'username' => 'required|string|max:50|unique:users,username',
            'email'    => 'nullable|email|unique:users,email',
            'password' => 'required|string|min:4',
            'roles'    => 'nullable|array',
            'roles.*'  => 'exists:roles,id',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'username' => $validated['username'],
            'email'    => $validated['email'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);

        if (!empty($validated['roles'])) {
            $user->roles()->sync($validated['roles']);
        }

        $user->load('roles');

        return response()->json([
            'message' => 'Usuário criado com sucesso.',
            'user'    => $user
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        $user->load('roles.permissions');

        $permissions = $user->roles
            ->flatMap(fn ($role) => $role->permissions)
            ->unique('id')
            ->values()
            ->map(fn ($p) => [
                'screen' => $p->screen,
                'action' => $p->action,
            ]);

        return response()->json([
            ...$user->toArray(),
            'permissions' => $permissions,
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'username' => 'sometimes|string|max:50|unique:users,username,' . $user->id,
            'email'    => 'nullable|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'roles'    => 'nullable|array',
            'roles.*'  => 'exists:roles,id',
        ]);

        $user->update([
            'name'     => $validated['name'] ?? $user->name,
            'username' => $validated['username'] ?? $user->username,
            'email'    => $validated['email'] ?? $user->email,
            'password' => isset($validated['password']) 
                            ? Hash::make($validated['password']) 
                            : $user->password,
        ]);

        if (isset($validated['roles'])) {
            $user->roles()->sync($validated['roles']);
        }

        $user->load('roles');

        return response()->json([
            'message' => 'Usuário atualizado com sucesso.',
            'user'    => $user
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();
        return response()->json([
            'message' => 'Usuário excluído com sucesso.'
        ], 204);
    }
}
