<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PromotionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'discount_type' => $this->discount_type?->value ?? $this->discount_type,
            'discount_value' => $this->discount_value,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'active' => $this->active,
            'min_purchase_amount' => $this->min_purchase_amount,
            'max_discount' => $this->max_discount,
            'is_recurring' => $this->is_recurring,
            'recurrence_type' => $this->recurrence_type?->value ?? $this->recurrence_type,
            'recurrence_weekdays' => $this->recurrence_weekdays,
            'recurrence_week_of_month' => $this->recurrence_week_of_month,
            'recurrence_month' => $this->recurrence_month,
            'recurrence_day_of_month' => $this->recurrence_day_of_month,
            'applicable_services' => $this->whenLoaded('services', function () {
                return $this->services->pluck('id');
            }),
            'applicable_items' => $this->whenLoaded('items', function () {
                return $this->items->pluck('id');
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
