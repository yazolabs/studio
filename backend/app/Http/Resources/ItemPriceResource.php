<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ItemPrice */
class ItemPriceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'itemId' => $this->item_id,
            'price' => $this->price,
            'cost' => $this->cost,
            'margin' => $this->margin,
            'effectiveDate' => $this->effective_date?->toDateString(),
            'notes' => $this->notes,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
