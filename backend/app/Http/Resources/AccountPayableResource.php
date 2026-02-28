<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AccountPayableResource extends JsonResource
{
    public function toArray($request): array
    {
        $statusValue = is_object($this->status) ? $this->status->value : $this->status;

        $commissionCompat = null;
        if ($this->origin_type === 'commission' && $this->relationLoaded('origin') && $this->origin) {
            $commissionCompat = [
                'id' => $this->origin->id,
                'status' => is_object($this->origin->status) ? $this->origin->status->value : $this->origin->status,
                'payment_date' => $this->origin->payment_date?->toDateString(),
            ];
        }

        $originNormalized = null;

        if (($this->origin_type ?? null) === 'commission') {
            if ($this->relationLoaded('origin') && $this->origin) {
                $originNormalized = [
                    'type' => 'commission',
                    'id' => $this->origin->id,
                    'status' => is_object($this->origin->status) ? $this->origin->status->value : $this->origin->status,
                    'payment_date' => $this->origin->payment_date?->toDateString(),
                ];
            } else {
                $originNormalized = [
                    'type' => 'commission',
                    'id' => $this->origin_id ? (int) $this->origin_id : null,
                ];
            }
        } elseif (($this->origin_type ?? null) === 'manual') {
            $originNormalized = [
                'type' => 'manual',
                'id' => null,
            ];
        } elseif (!empty($this->origin_type)) {
            $originNormalized = [
                'type' => (string) $this->origin_type,
                'id' => $this->origin_id ? (int) $this->origin_id : null,
            ];
        }

        return [
            'id' => $this->id,
            'description' => $this->description,
            'amount' => $this->amount,
            'due_date' => $this->due_date?->toDateString(),
            'status' => $statusValue,
            'category' => $this->category,
            'supplier_id' => $this->supplier_id,
            'professional_id' => $this->professional_id,
            'appointment_id' => $this->appointment_id,
            'origin_type' => $this->origin_type,
            'origin_id' => $this->origin_id,
            'origin' => $originNormalized,
            'commission' => $commissionCompat,
            'professional' => $this->whenLoaded('professional', function () {
                $name = $this->professional?->name;

                if (!$name && isset($this->professional?->user)) {
                    $name = $this->professional->user->name ?? null;
                }

                return [
                    'id' => $this->professional->id,
                    'name' => $name,
                ];
            }),
            'appointment' => $this->whenLoaded('appointment', fn () => [
                'id' => $this->appointment->id,
                'date' => $this->appointment->date?->toDateString(),
                'payment_method' => $this->appointment->payment_method ?? null,
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
