<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CommissionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'professional' => $this->whenLoaded('professional', function () {
                return [
                    'id' => $this->professional->id,
                    'name' => $this->professional->name,
                ];
            }),
            'customer' => $this->whenLoaded('customer', function () {
                return [
                    'id' => $this->customer->id,
                    'name' => $this->customer->name,
                ];
            }),
            'service' => $this->whenLoaded('service', function () {
                return [
                    'id' => $this->service->id,
                    'name' => $this->service->name,
                ];
            }),
            'appointment_id' => $this->appointment_id,
            'date' => $this->date?->toDateString(),
            'service_price' => $this->service_price,
            'commission_type' => $this->commission_type,
            'commission_value' => $this->commission_value,
            'commission_amount' => $this->commission_amount,
            'status' => $this->status,
            'payment_date' => $this->payment_date?->toDateString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
