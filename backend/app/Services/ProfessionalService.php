<?php

namespace App\Services;

use App\Models\Professional;
use Illuminate\Database\Eloquent\Builder;

class ProfessionalService extends BaseService
{
    protected function model(): string
    {
        return Professional::class;
    }

    protected function applySearch(Builder $builder, string $term): void
    {
        $builder->where(function (Builder $query) use ($term) {
            $query->where('name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%");
        });
    }
}
