<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ItemPriceHistory */
class ItemPriceHistoryResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'itemId' => $this->item_id,
            'oldPrice' => $this->old_price,
            'newPrice' => $this->new_price,
            'changeDate' => $this->change_date?->toISOString(),
            'changedBy' => $this->changed_by,
            'reason' => $this->reason,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
