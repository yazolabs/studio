<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AccountPayableResource extends JsonResource
{
    public function toArray($request): array
    {
        $origin = $this->whenLoaded('origin', fn () => $this->origin);

        $commissionCompat = null;
        if ($this->origin_type === 'commission' && $this->relationLoaded('origin') && $this->origin) {
            $commissionCompat = [
                'id' => $this->origin->id,
                'status' => is_object($this->origin->status) ? $this->origin->status->value : $this->origin->status,
                'payment_date' => $this->origin->payment_date?->toDateString(),
            ];
        }

        return [
            'id' => $this->id,
            'description' => $this->description,
            'amount' => $this->amount,
            'due_date' => $this->due_date?->toDateString(),
            'status' => is_object($this->status) ? $this->status->value : $this->status,
            'category' => $this->category,
            'supplier_id' => $this->supplier_id,
            'origin_type' => $this->origin_type,
            'origin_id' => $this->origin_id,
            'origin' => $this->whenLoaded('origin', function () {
                if ($this->origin_type === 'commission' && $this->origin) {
                    return [
                        'type' => 'commission',
                        'id' => $this->origin->id,
                        'status' => is_object($this->origin->status) ? $this->origin->status->value : $this->origin->status,
                        'payment_date' => $this->origin->payment_date?->toDateString(),
                    ];
                }

                return $this->origin ? [
                    'type' => $this->origin_type,
                    'id' => $this->origin_id,
                ] : null;
            }),
            'commission' => $commissionCompat,
            'professional' => $this->whenLoaded('professional', fn () => [
                'id' => $this->professional->id,
                'name' => $this->professional->name ?? $this->professional->user->name ?? null,
            ]),
            'appointment' => $this->whenLoaded('appointment', fn () => [
                'id' => $this->appointment->id,
                'date' => $this->appointment->date?->toDateString(),
                'payment_method' => $this->appointment->payment_method,
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
