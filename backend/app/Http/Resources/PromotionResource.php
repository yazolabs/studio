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
            'discountType' => $this->discount_type,
            'discountValue' => $this->discount_value,
            'startDate' => $this->start_date?->toDateString(),
            'endDate' => $this->end_date?->toDateString(),
            'active' => $this->active,
            'minPurchaseAmount' => $this->min_purchase_amount,
            'maxDiscount' => $this->max_discount,
            'applicableServices' => $this->whenLoaded('services', function () {
                return $this->services->pluck('id');
            }),
            'applicableItems' => $this->whenLoaded('items', function () {
                return $this->items->pluck('id');
            }),
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
