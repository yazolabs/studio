<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuthUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $login = $request->string('login')->trim();
        $password = (string) $credentials['password'];

        if (! $this->attemptLogin($login, $password)) {
            throw ValidationException::withMessages([
                'login' => ['As credenciais estão incorretas.'],
            ]);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::guard('web')->user();

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'user' => new AuthUserResource($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Usuário não autenticado.',
            ], 401);
        }

        return response()->json([
            'user' => new AuthUserResource($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }

    private function attemptLogin(string $login, string $password): bool
    {
        $guard = Auth::guard('web');

        if ($guard->attempt(['email' => $login, 'password' => $password])) {
            return true;
        }

        return $guard->attempt(['username' => $login, 'password' => $password]);
    }
}
