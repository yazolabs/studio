<?php

namespace App\Services;

use App\Models\ItemPriceHistory;
use Illuminate\Database\Eloquent\Builder;

class ItemPriceHistoryService extends BaseService
{
    protected function model(): string
    {
        return ItemPriceHistory::class;
    }

    protected function applySearch(Builder $builder, string $term): void
    {
        $builder->where(function (Builder $query) use ($term) {
            $query->where('reason', 'like', "%{$term}%");
        });
    }
}
