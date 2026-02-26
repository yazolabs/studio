<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class RouteServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        RateLimiter::for('cashier-pin', function (Request $request) {
            $userId = optional($request->user())->id ?: 'guest';
            $key = $userId . '|' . $request->ip();

            return [
                Limit::perMinute(5)->by($key),
                Limit::perHour(30)->by($key),
            ];
        });
    }
}
