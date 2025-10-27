<?php

namespace App\Services;

use App\Models\Service;
use Illuminate\Database\Eloquent\Builder;

class ServiceService extends BaseService
{
    protected function model(): string
    {
        return Service::class;
    }

    protected function applySearch(Builder $builder, string $term): void
    {
        $builder->where(function (Builder $query) use ($term) {
            $query->where('name', 'like', "%{$term}%")
                ->orWhere('category', 'like', "%{$term}%");
        });
    }
}
