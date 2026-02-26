<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureCashierPinUnlocked;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CashierPinController extends Controller
{
    private int $unlockMinutes = 30;

    private function cacheKey(int $userId): string
    {
        return EnsureCashierPinUnlocked::CACHE_PREFIX . $userId;
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'pin_set'  => !empty($user?->cashier_pin_hash),
            'unlocked' => $user ? Cache::has($this->cacheKey($user->id)) : false,
        ]);
    }

    public function unlock(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pin' => ['required', 'string', 'regex:/^\d{4}$/'],
        ]);

        $user = $request->user();

        if (empty($user->cashier_pin_hash)) {
            return response()->json([
                'message' => 'PIN do caixa não configurado.',
                'code'    => 'CASHIER_PIN_NOT_SET',
            ], 403);
        }

        if (!$user->checkCashierPin($data['pin'])) {
            return response()->json([
                'message' => 'PIN inválido.',
                'code'    => 'CASHIER_PIN_INVALID',
            ], 422);
        }

        Cache::forever($this->cacheKey($user->id), true);

        return response()->json([
            'message'  => 'Caixa desbloqueado com sucesso.',
            'unlocked' => true,
        ]);
    }

    public function lock(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            Cache::forget($this->cacheKey($user->id));
        }

        return response()->json([
            'message' => 'Caixa bloqueado.',
            'unlocked' => false,
        ]);
    }

    public function setPin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pin' => ['required', 'string', 'regex:/^\d{4}$/'],
        ]);

        $user = $request->user();

        Cache::forget($this->cacheKey($user->id));

        $user->setCashierPin($data['pin']);

        return response()->json([
            'message' => 'PIN do caixa atualizado com sucesso.',
            'pin_set' => true,
        ]);
    }
}