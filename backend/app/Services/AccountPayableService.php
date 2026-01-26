<?php

namespace App\Services;

use App\Models\{AccountPayable, Commission};
use Illuminate\Database\Eloquent\{Builder, Model};
use Illuminate\Support\Facades\DB;

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

    public function create(array $data): Model
    {
        return DB::transaction(function () use ($data) {

            if (empty($data['due_date'])) {
                $data['due_date'] = now()->addDays(5)->toDateString();
            }

            if (!empty($data['status']) && is_object($data['status'])) {
                $data['status'] = $data['status']->value;
            }

            $data = $this->hydrateOriginFromCommission($data);

            $account = parent::create($data);

            $this->syncCommission($account);

            return $account;
        });
    }

    public function update(Model $model, array $data): Model
    {
        return DB::transaction(function () use ($model, $data) {

            if (!empty($data['status']) && is_object($data['status'])) {
                $data['status'] = $data['status']->value;
            }

            if (
                array_key_exists('origin_type', $data) ||
                array_key_exists('origin_id', $data) ||
                array_key_exists('appointment_id', $data) ||
                array_key_exists('professional_id', $data)
            ) {
                $merged = array_merge($model->toArray(), $data);
                $data = $this->hydrateOriginFromCommission($data, $merged);
            }

            $account = parent::update($model, $data);

            $this->syncCommission($account);

            return $account;
        });
    }

    protected function hydrateOriginFromCommission(array $data, ?array $context = null): array
    {
        $ctx = $context ?? $data;

        if (!empty($ctx['origin_type']) || !empty($ctx['origin_id'])) {
            return $data;
        }

        if (empty($ctx['appointment_id']) || empty($ctx['professional_id'])) {
            return $data;
        }

        $commissionId = Commission::query()
            ->where('appointment_id', $ctx['appointment_id'])
            ->where('professional_id', $ctx['professional_id'])
            ->orderBy('id')
            ->value('id');

        if ($commissionId) {
            $data['origin_type'] = 'commission';
            $data['origin_id'] = $commissionId;
        }

        return $data;
    }

    protected function syncCommission(AccountPayable $account): void
    {
        if ($account->origin_type === 'commission' && !empty($account->origin_id)) {
            $commission = Commission::query()->find($account->origin_id);
        } else {
            if (!$account->appointment_id || !$account->professional_id) {
                return;
            }

            $commission = Commission::query()
                ->where('appointment_id', $account->appointment_id)
                ->where('professional_id', $account->professional_id)
                ->orderBy('id')
                ->first();
        }

        if (!$commission) {
            return;
        }

        $status = is_object($account->status)
            ? $account->status->value
            : $account->status;

        if ($status === 'paid') {
            $commission->update([
                'status'       => 'paid',
                'payment_date' => $account->payment_date ?? now()->toDateString(),
            ]);
        } else {
            $commission->update([
                'status'       => 'pending',
                'payment_date' => null,
            ]);
        }
    }
}
