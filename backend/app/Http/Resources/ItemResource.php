<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Item */
class ItemResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => $this->price,
            'cost' => $this->cost,
            'stock' => $this->stock,
            'min_stock' => $this->min_stock,
            'category' => $this->category,
            'supplier_id' => $this->supplier_id,
            'barcode' => $this->barcode,
            'commission_type' => $this->commission_type,
            'commission_value' => $this->commission_value,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
