<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Commission */
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
            'appointmentId' => $this->appointment_id,
            'date' => $this->date?->toDateString(),
            'servicePrice' => $this->service_price,
            'commissionType' => $this->commission_type,
            'commissionValue' => $this->commission_value,
            'commissionAmount' => $this->commission_amount,
            'status' => $this->status,
            'paymentDate' => $this->payment_date?->toDateString(),
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
