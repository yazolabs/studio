<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class EnsureCashierPinUnlocked
{
    public const CACHE_PREFIX = 'cashier_unlocked:';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (empty($user->cashier_pin_hash)) {
            return response()->json([
                'message' => 'PIN do caixa não configurado.',
                'code'    => 'CASHIER_PIN_NOT_SET',
            ], 403);
        }

        $key = self::CACHE_PREFIX . $user->id;

        if (!Cache::has($key)) {
            return response()->json([
                'message' => 'PIN do caixa requerido.',
                'code'    => 'CASHIER_PIN_REQUIRED',
            ], 423);
        }

        return $next($request);
    }
}