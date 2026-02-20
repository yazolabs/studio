<?php

namespace App\Services;

use App\Models\{AccountPayable, Commission, AppointmentService};
use Illuminate\Database\Eloquent\{Builder, Model};
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

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

            $data = $this->hydrateAppointmentServiceLink($data);

            unset($data['_auto']);

            if (!array_key_exists('commission_amount', $data) || $data['commission_amount'] === null || $data['commission_amount'] === '') {
                $data['commission_amount'] = $this->calculateCommissionAmount($data);
            }

            /** @var Commission $created */
            $created = parent::create($data);

            $this->syncAccountPayableFromCommission($created);

            return $created;
        });
    }

    public function createAuto(array $data): Model
    {
        return DB::transaction(function () use ($data) {
            $data['_auto'] = true;

            if (empty($data['date'])) {
                $data['date'] = now()->toDateString();
            }

            $data = $this->hydrateAppointmentServiceLink($data);

            unset($data['_auto']);

            if (!array_key_exists('commission_amount', $data) || $data['commission_amount'] === null || $data['commission_amount'] === '') {
                $data['commission_amount'] = $this->calculateCommissionAmount($data);
            }

            /** @var Commission $created */
            $created = parent::create($data);

            $this->syncAccountPayableFromCommission($created);

            return $created;
        });
    }

    public function update(Model $model, array $data): Model
    {
        return DB::transaction(function () use ($model, $data) {

            if (
                array_key_exists('appointment_service_id', $data) ||
                array_key_exists('appointment_id', $data) ||
                array_key_exists('service_id', $data) ||
                array_key_exists('professional_id', $data)
            ) {
                $merged = array_merge($model->toArray(), $data);
                $data = $this->hydrateAppointmentServiceLink($data, $merged);
            }

            $shouldRecalc =
                (array_key_exists('service_price', $data) ||
                 array_key_exists('commission_type', $data) ||
                 array_key_exists('commission_value', $data));

            $hasManualCommissionAmount = array_key_exists('commission_amount', $data);

            if ($shouldRecalc && !$hasManualCommissionAmount) {
                $merged = array_merge($model->toArray(), $data);
                $data['commission_amount'] = $this->calculateCommissionAmount($merged);
            }

            unset($data['_auto']);

            /** @var Commission $updated */
            $updated = parent::update($model, $data);

            $this->syncAccountPayableFromCommission($updated);

            return $updated;
        });
    }

    public function updateAuto(Model $model, array $data): Model
    {
        $data['_auto'] = true;
        return $this->update($model, $data);
    }

    protected function hydrateAppointmentServiceLink(array $data, ?array $context = null): array
    {
        $ctx = $context ?? $data;

        if (!empty($data['appointment_service_id'])) {
            $svc = AppointmentService::query()->find($data['appointment_service_id']);

            if (!$svc) {
                throw ValidationException::withMessages([
                    'appointment_service_id' => ['appointment_service_id inválido.'],
                ]);
            }

            foreach (['appointment_id', 'service_id', 'professional_id'] as $k) {
                if (!empty($ctx[$k]) && (int)$ctx[$k] !== (int)$svc->{$k}) {
                    throw ValidationException::withMessages([
                        'appointment_service_id' => ["appointment_service_id não bate com {$k} informado."],
                    ]);
                }
            }

            $data['appointment_id'] ??= $svc->appointment_id;
            $data['service_id'] ??= $svc->service_id;
            $data['professional_id'] ??= $svc->professional_id;

            $gross = (float) $svc->service_price;
            $promoDiscount = (float) $svc->promotions()->sum('appointment_service_promotion.discount_amount');
            $final = max(0.0, round($gross - $promoDiscount, 2));

            $data['service_price'] ??= $final;
            $data['commission_type'] ??= $svc->commission_type;
            $data['commission_value'] ??= $svc->commission_value;

            return $data;
        }

        if (!empty($ctx['appointment_id']) && !empty($ctx['service_id']) && !empty($ctx['professional_id'])) {
            $svcId = AppointmentService::query()
                ->where('appointment_id', $ctx['appointment_id'])
                ->where('service_id', $ctx['service_id'])
                ->where('professional_id', $ctx['professional_id'])
                ->orderBy('id')
                ->value('id');

            if ($svcId) {
                $data['appointment_service_id'] = $svcId;
            }
        }

        if (!empty($data['_auto']) && empty($data['appointment_service_id'])) {
            throw ValidationException::withMessages([
                'appointment_service_id' => ['Não foi possível resolver appointment_service_id automaticamente.'],
            ]);
        }

        return $data;
    }

    protected function calculateCommissionAmount(array $data): float
    {
        $price = round((float) ($data['service_price'] ?? 0), 2);
        $value = round((float) ($data['commission_value'] ?? 0), 2);
        $type  = $data['commission_type'] ?? 'percentage';

        if ($price <= 0) return 0.0;

        if ($type === 'percentage') {
            return round(($price * $value) / 100, 2);
        }

        return round(min($value, $price), 2);
    }

    protected function syncAccountPayableFromCommission(Commission $commission): void
    {
        $status = is_object($commission->status) ? $commission->status->value : (string) $commission->status;

        $updates = [
            'amount' => (float) $commission->commission_amount,
            'professional_id' => $commission->professional_id,
            'appointment_id'  => $commission->appointment_id,
        ];

        if ($status === 'paid') {
            $updates['status'] = 'paid';
            $updates['payment_date'] = $commission->payment_date ?? now()->toDateString();
        } else {
            $updates['status'] = 'pending';
            $updates['payment_date'] = null;
        }

        AccountPayable::query()
            ->where('origin_type', 'commission')
            ->where('origin_id', $commission->id)
            ->update($updates);
    }
}
