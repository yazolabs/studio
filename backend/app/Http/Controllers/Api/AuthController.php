<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'login'    => 'required|string',
            'password' => 'required|string',
        ]);

        $login = $request->input('login');
        $password = $request->input('password');

        /** @var User|null $user */
        $user = User::where('email', $login)
            ->orWhere('username', $login)
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['As credenciais estão incorretas.'],
            ]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'token'   => $token,
            'user'    => $user,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Usuário não autenticado.'], 401);
        }

        $user->load([
            'roles.permissions.screen',
            'roles.permissions.action',
        ]);

        $byScreen = [];

        foreach ($user->roles as $role) {
            foreach ($role->permissions as $perm) {
                $screen = $perm->screen?->slug;
                $action = $perm->action?->slug;

                if (! $screen || ! $action) continue;

                if (! isset($byScreen[$screen])) {
                    $byScreen[$screen] = [];
                }

                $byScreen[$screen][$action] = true;
            }
        }

        $permissions = collect($byScreen)
            ->map(function ($actions, $screen) {
                return [
                    'screen'  => $screen,
                    'actions' => array_values(array_keys($actions)),
                ];
            })
            ->values();

        return response()->json([
            'user'        => $user,
            'permissions' => $permissions,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout realizado com sucesso.']);
    }
}
