<?php

namespace App\Services;

use App\Models\Promotion;
use Illuminate\Database\Eloquent\Builder;

class PromotionService extends BaseService
{
    protected function model(): string
    {
        return Promotion::class;
    }

    protected function applySearch(Builder $builder, string $term): void
    {
        $builder->where(function (Builder $query) use ($term) {
            $query->where('name', 'like', "%{$term}%")
                ->orWhere('description', 'like', "%{$term}%");
        });
    }
}
