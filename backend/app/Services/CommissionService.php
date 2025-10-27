<?php

namespace App\Services;

use App\Models\Commission;
use Illuminate\Database\Eloquent\Builder;

class CommissionService extends BaseService
{
    protected function model(): string
    {
        return Commission::class;
    }

    protected function applySearch(Builder $builder, string $term): void
    {
        $builder->where(function (Builder $query) use ($term) {
            $query->orWhereHas('professional', function (Builder $relation) use ($term) {
                $relation->where('name', 'like', "%{$term}%");
            })->orWhereHas('customer', function (Builder $relation) use ($term) {
                $relation->where('name', 'like', "%{$term}%");
            })->orWhereHas('service', function (Builder $relation) use ($term) {
                $relation->where('name', 'like', "%{$term}%");
            });
        });
    }
}
