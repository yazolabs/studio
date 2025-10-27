<?php

namespace App\Services;

use App\Models\AccountPayable;
use Illuminate\Database\Eloquent\Builder;

class AccountPayableService extends BaseService
{
    protected function model(): string
    {
        return AccountPayable::class;
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
