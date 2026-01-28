<?php

namespace App\Services;

use App\Models\Promotion;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class PromotionApplicabilityService
{
    public function isApplicable(
        Promotion $promo,
        Carbon $date,
        array $serviceIds = [],
        array $itemIds = []
    ): bool {
        if (!$promo->active) return false;

        if ($promo->start_date && $date->copy()->startOfDay()->lt($promo->start_date->copy()->startOfDay())) {
            return false;
        }
        if ($promo->end_date && $date->copy()->startOfDay()->gt($promo->end_date->copy()->startOfDay())) {
            return false;
        }

        $promoServiceIds = $this->getRelatedIds($promo, 'services');
        if ($promoServiceIds->isNotEmpty()) {
            if (empty($serviceIds)) return false;
            if ($promoServiceIds->intersect($serviceIds)->isEmpty()) return false;
        }

        $promoItemIds = $this->getRelatedIds($promo, 'items');
        if ($promoItemIds->isNotEmpty()) {
            if (empty($itemIds)) return false;
            if ($promoItemIds->intersect($itemIds)->isEmpty()) return false;
        }

        if (!$promo->is_recurring || !$promo->recurrence_type) {
            return true;
        }

        $type = $promo->recurrence_type?->value ?? (string) $promo->recurrence_type;

        if ($type === 'weekly') {
            $days = is_array($promo->recurrence_weekdays) ? $promo->recurrence_weekdays : [];
            return count($days) === 0 ? true : in_array($date->dayOfWeek, $days, true);
        }

        if ($type === 'monthly_weekday') {
            $days = is_array($promo->recurrence_weekdays) ? $promo->recurrence_weekdays : [];
            $okDay = count($days) === 0 ? true : in_array($date->dayOfWeek, $days, true);
            if (!$okDay) return false;

            $targetWeek = $promo->recurrence_week_of_month ? (int) $promo->recurrence_week_of_month : null;
            if (!$targetWeek) return true;

            $week = $this->getWeekOfMonthForWeekday($date);
            return $week !== null && $week === $targetWeek;
        }

        if ($type === 'yearly') {
            $mm = $promo->recurrence_month ? (int) $promo->recurrence_month : null;
            $dd = $promo->recurrence_day_of_month ? (int) $promo->recurrence_day_of_month : null;
            if (!$mm || !$dd) return false;

            return ((int) $date->month === $mm) && ((int) $date->day === $dd);
        }

        return false;
    }

    private function getRelatedIds(Promotion $promo, string $relation): Collection
    {
        if ($promo->relationLoaded($relation)) {
            return $promo->{$relation}->pluck('id')->map(fn ($v) => (int) $v)->values();
        }

        $qualifiedId = match ($relation) {
            'services' => 'services.id',
            'items'    => 'items.id',
            default    => 'id',
        };

        return $promo->{$relation}()
            ->select($qualifiedId)
            ->distinct()
            ->pluck($qualifiedId)
            ->map(fn ($v) => (int) $v)
            ->values();
    }

    private function getWeekOfMonthForWeekday(Carbon $date): ?int
    {
        $d = $date->copy()->startOfDay();
        $weekday = $d->dayOfWeek;

        $first = $d->copy()->startOfMonth();
        $diff = ($weekday - $first->dayOfWeek + 7) % 7;
        $firstOccur = $first->copy()->addDays($diff);

        if ($d->lt($firstOccur)) return null;

        return (int) floor(($d->day - $firstOccur->day) / 7) + 1;
    }
}
