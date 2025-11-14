<?php

namespace App\Services;

use App\Models\Commission;
use Illuminate\Database\Eloquent\{Builder, Model};
use Illuminate\Support\Facades\DB;

class CommissionService extends BaseService
{
    protected function model(): string
    {
        return Commission::class;
    }

    protected function applySearch(Builder $builder, string $term): void
    {
        $builder->where(function (Builder $query) use ($term) {
            $query->orWhereHas('professional', fn(Builder $q) => $q->where('name', 'like', "%{$term}%"))
                  ->orWhereHas('customer', fn(Builder $q) => $q->where('name', 'like', "%{$term}%"))
                  ->orWhereHas('service', fn(Builder $q) => $q->where('name', 'like', "%{$term}%"));
        });
    }

    public function create(array $data): Model
    {
        return DB::transaction(function () use ($data) {

            if (empty($data['date'])) {
                $data['date'] = now()->toDateString();
            }

            $data['commission_amount'] = $this->calculateCommissionAmount($data);

            return parent::create($data);
        });
    }

    public function update(Model $model, array $data): Model
    {
        return DB::transaction(function () use ($model, $data) {

            if (
                isset($data['service_price']) ||
                isset($data['commission_type']) ||
                isset($data['commission_value'])
            ) {
                $data['commission_amount'] = $this->calculateCommissionAmount($data);
            }

            return parent::update($model, $data);
        });
    }

    protected function calculateCommissionAmount(array $data): float
    {
        $price = (float) ($data['service_price'] ?? 0);
        $value = (float) ($data['commission_value'] ?? 0);
        $type  = $data['commission_type'] ?? 'percentage';

        return $type === 'percentage'
            ? round(($price * $value) / 100, 2)
            : round($value, 2);
    }
}
