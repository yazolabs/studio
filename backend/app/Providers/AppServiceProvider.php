<?php

namespace App\Providers;

use App\Models\{AccountPayable, Commission};
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Relations\Relation;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Relation::morphMap([
            'commission' => Commission::class,
            'manual'     => AccountPayable::class,
        ]);
    }
}
