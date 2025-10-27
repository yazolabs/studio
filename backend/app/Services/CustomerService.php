<?php

namespace App\Services;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Builder;

class CustomerService extends BaseService
{
    protected function model(): string
    {
        return Customer::class;
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
