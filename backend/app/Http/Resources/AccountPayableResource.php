<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AccountPayableResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'description' => $this->description,
            'amount' => $this->amount,
            'due_date' => $this->due_date?->toDateString(),
            'status' => $this->status,
            'category' => $this->category,
            'supplier_id' => $this->supplier_id,
            'origin_type' => $this->origin_type,
            'origin_id' => $this->origin_id,
            'professional' => $this->whenLoaded('professional', fn() => [
                'id' => $this->professional->id,
                'name' => $this->professional->name ?? $this->professional->user->name ?? null,
            ]),
            'appointment' => $this->whenLoaded('appointment', fn() => [
                'id' => $this->appointment->id,
                'date' => $this->appointment->date?->toDateString(),
                'payment_method' => $this->appointment->payment_method,
            ]),
            'commission' => $this->whenLoaded('commission', fn() => [
                'id' => $this->commission->id,
                'status' => $this->commission->status,
                'payment_date' => $this->commission->payment_date?->toDateString(),
            ]),
            'payment_date' => $this->payment_date?->toDateString(),
            'payment_method' => $this->payment_method,
            'reference' => $this->reference,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
