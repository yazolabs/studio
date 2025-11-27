<?php

namespace App\Services;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Builder;

class SupplierService extends BaseService
{
    protected function model(): string
    {
        return Supplier::class;
    }

    protected function applySearch(Builder $builder, string $term): void
    {
        $builder->where(function (Builder $query) use ($term) {
            $query->where('name', 'like', "%{$term}%")
                ->orWhere('trade_name', 'like', "%{$term}%")
                ->orWhere('cnpj', 'like', "%{$term}%")
                ->orWhere('cpf', 'like', "%{$term}%");
        });
    }
}
