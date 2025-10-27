<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $screen, string $action): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasPermission($screen, $action)) {
            return response()->json([
                'message' => 'Você não tem permissão para acessar este recurso.'
            ], 403);
        }

        return $next($request);
    }
}
