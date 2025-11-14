<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CommissionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'professional' => $this->whenLoaded('professional', fn() => [
                'id' => $this->professional->id,
                'name' => $this->professional->name ?? $this->professional->user->name ?? null,
            ]),
            'customer' => $this->whenLoaded('customer', fn() => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
            ]),
            'service' => $this->whenLoaded('service', fn() => [
                'id' => $this->service->id,
                'name' => $this->service->name,
            ]),
            'appointment' => $this->whenLoaded('appointment', fn() => [
                'id' => $this->appointment->id,
                'date' => $this->appointment->date?->toDateString(),
                'payment_method' => $this->appointment->payment_method,
            ]),
            'date' => $this->date?->toDateString(),
            'service_price' => $this->service_price,
            'commission_type' => $this->commission_type,
            'commission_value' => $this->commission_value,
            'commission_amount' => $this->commission_amount,
            'status' => $this->status,
            'payment_date' => $this->payment_date?->toDateString(),
            'account_payable_id' => $this->whenLoaded('accountPayable', fn() => $this->accountPayable?->id),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
