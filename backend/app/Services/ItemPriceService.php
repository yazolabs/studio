<?php

namespace App\Services;

use App\Models\ItemPrice;
use Illuminate\Database\Eloquent\Builder;

class ItemPriceService extends BaseService
{
    protected function model(): string
    {
        return ItemPrice::class;
    }

    protected function applySearch(Builder $builder, string $term): void
    {
        $builder->where(function (Builder $query) use ($term) {
            $query->where('notes', 'like', "%{$term}%");
        });
    }
}
