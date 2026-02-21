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

            /** @var AccountPayable $account */
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
                array_key_exists('commission_id', $data) ||
                array_key_exists('origin_type', $data) ||
                array_key_exists('origin_id', $data) ||
                array_key_exists('reference', $data) ||
                array_key_exists('appointment_id', $data) ||
                array_key_exists('professional_id', $data)
            ) {
                $merged = array_merge($model->toArray(), $data);
                $data = $this->hydrateOriginFromCommission($data, $merged);
            }

            /** @var AccountPayable $account */
            $account = parent::update($model, $data);

            $this->syncCommission($account);

            return $account;
        });
    }

    protected function hydrateOriginFromCommission(array $data, ?array $context = null): array
    {
        $ctx = $context ?? $data;

        if (empty($ctx['commission_id']) && !empty($ctx['origin_type']) && (string) $ctx['origin_type'] === 'commission' && !empty($ctx['origin_id'])) {
            $data['commission_id'] = (int) $ctx['origin_id'];
        }

        if (!empty($ctx['commission_id'])) {
            $cid = (int) $ctx['commission_id'];
            $data['commission_id'] = $cid;
            $data['origin_type'] = 'commission';
            $data['origin_id'] = $cid;
            return $data;
        }

        if (!empty($ctx['origin_type']) && (string) $ctx['origin_type'] === 'commission' && !empty($ctx['origin_id'])) {
            $cid = (int) $ctx['origin_id'];
            $data['origin_type'] = 'commission';
            $data['origin_id'] = $cid;
            $data['commission_id'] = $cid;
            return $data;
        }

        $ref = (string) ($ctx['reference'] ?? '');
        $apsId = $this->extractApsIdFromReference($ref);

        if ($apsId) {
            $cid = (int) Commission::query()
                ->where('appointment_service_id', $apsId)
                ->orderBy('id')
                ->value('id');

            if ($cid) {
                $data['origin_type'] = 'commission';
                $data['origin_id'] = $cid;
                $data['commission_id'] = $cid;
            }
        }

        return $data;
    }

    protected function syncCommission(AccountPayable $account): void
    {
        $commissionId = null;

        if (!empty($account->commission_id)) {
            $commissionId = (int) $account->commission_id;
        } elseif ((string) $account->origin_type === 'commission' && !empty($account->origin_id)) {
            $commissionId = (int) $account->origin_id;
        } else {
            $apsId = $this->extractApsIdFromReference((string) $account->reference);
            if ($apsId) {
                $commissionId = (int) Commission::query()
                    ->where('appointment_service_id', $apsId)
                    ->orderBy('id')
                    ->value('id');
            }
        }

        if (!$commissionId) {
            return;
        }

        $needsBackfill =
            (empty($account->commission_id) || (int) $account->commission_id !== (int) $commissionId) ||
            ((string) $account->origin_type !== 'commission') ||
            (empty($account->origin_id) || (int) $account->origin_id !== (int) $commissionId);

        if ($needsBackfill) {
            $account->forceFill([
                'commission_id' => $commissionId,
                'origin_type'   => 'commission',
                'origin_id'     => $commissionId,
            ])->saveQuietly();
        }

        $status = is_object($account->status) ? $account->status->value : (string) $account->status;

        $updates = [];

        if ($account->amount !== null) {
            $updates['commission_amount'] = (float) $account->amount;
        }

        if ($status === 'paid') {
            $updates['status'] = 'paid';
            $updates['payment_date'] = $account->payment_date ?? now()->toDateString();
        } else {
            $updates['status'] = 'pending';
            $updates['payment_date'] = null;
        }

        if (!empty($updates)) {
            Commission::query()->where('id', $commissionId)->update($updates);
        }
    }

    private function extractApsIdFromReference(string $ref): ?int
    {
        if (!$ref) return null;

        if (preg_match('/APP-\d+-APS-(\d+)/', $ref, $m)) {
            $apsId = (int) ($m[1] ?? 0);
            return $apsId > 0 ? $apsId : null;
        }

        return null;
    }
}