<?php

namespace App\Services;

use App\Models\CashierTransaction;
use Illuminate\Database\Eloquent\Builder;

class CashierTransactionService extends BaseService
{
    protected function model(): string
    {
        return CashierTransaction::class;
    }

    protected function applySearch(Builder $builder, string $term): void
    {
        $builder->where(function (Builder $query) use ($term) {
            $query->where('description', 'like', "%{$term}%")
                ->orWhere('category', 'like', "%{$term}%")
                ->orWhere('reference', 'like', "%{$term}%");
        });
    }
}
