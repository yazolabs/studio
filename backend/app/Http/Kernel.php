<?php

namespace App\Http;

use App\Http\Middleware\{Authenticate, EncryptCookies, RedirectIfAuthenticated, TrimStrings, TrustProxies, VerifyCsrfToken};
use Illuminate\Auth\Middleware\EnsureEmailIsVerified;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Http\Kernel as HttpKernel;
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Illuminate\Http\Middleware\{HandleCors, ValidatePostSize};
use Illuminate\Routing\Middleware\{SubstituteBindings, ThrottleRequests};
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;
use Laravel\Sanctum\Http\Middleware\{CheckAbilities, CheckForAnyAbility, EnsureFrontendRequestsAreStateful};

class Kernel extends HttpKernel
{
    protected function bootstrappers(): array
    {
        return parent::bootstrappers();
    }

    protected function middleware(): array
    {
        return [
            HandleCors::class,
            TrustProxies::class,
            ValidatePostSize::class,
            TrimStrings::class,
            ConvertEmptyStringsToNull::class,
        ];
    }

    protected function middlewareGroups(): array
    {
        return [
            'web' => [
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
            ],

            'api' => [
                EnsureFrontendRequestsAreStateful::class,
                ThrottleRequests::class . ':api',
                SubstituteBindings::class,
            ],
        ];
    }

    protected function middlewareAliases(): array
    {
        return [
            'auth'       => Authenticate::class,
            'guest'      => RedirectIfAuthenticated::class,
            'throttle'   => ThrottleRequests::class,
            'bindings'   => SubstituteBindings::class,
            'verified'   => EnsureEmailIsVerified::class,
            'abilities'  => CheckAbilities::class,
            'ability'    => CheckForAnyAbility::class,
        ];
    }
}
