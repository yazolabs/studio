<?php

namespace App\Services;

use App\Models\Item;
use Illuminate\Database\Eloquent\Builder;

class ItemService extends BaseService
{
    protected function model(): string
    {
        return Item::class;
    }

    protected function applySearch(Builder $builder, string $term): void
    {
        $builder->where(function (Builder $query) use ($term) {
            $query->where('name', 'like', "%{$term}%")
                ->orWhere('category', 'like', "%{$term}%")
                ->orWhere('barcode', 'like', "%{$term}%");
        });
    }
}
