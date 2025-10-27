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
            'minStock' => $this->min_stock,
            'category' => $this->category,
            'supplierId' => $this->supplier_id,
            'barcode' => $this->barcode,
            'commissionType' => $this->commission_type,
            'commissionValue' => $this->commission_value,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
