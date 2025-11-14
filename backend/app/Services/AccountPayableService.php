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

            $account = parent::update($model, $data);

            $this->syncCommission($account);

            return $account;
        });
    }

    protected function syncCommission(AccountPayable $account): void
    {
        if (!$account->appointment_id || !$account->professional_id) {
            return;
        }

        $commission = Commission::where('appointment_id', $account->appointment_id)
            ->where('professional_id', $account->professional_id)
            ->first();

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
