<?php

namespace App\Services;

use App\Models\Appointment;
use Illuminate\Database\Eloquent\Builder;

class AppointmentService extends BaseService
{
    protected function model(): string
    {
        return Appointment::class;
    }

    protected function applySearch(Builder $builder, string $term): void
    {
        $builder->where(function (Builder $query) use ($term) {
            $query->where('notes', 'like', "%{$term}%")
                ->orWhereHas('customer', function (Builder $relation) use ($term) {
                    $relation->where('name', 'like', "%{$term}%");
                })
                ->orWhereHas('professional', function (Builder $relation) use ($term) {
                    $relation->where('name', 'like', "%{$term}%");
                });
        });
    }
}
