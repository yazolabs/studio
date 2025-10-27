<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Appointment */
class AppointmentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'customer' => $this->whenLoaded('customer', function () {
                return [
                    'id' => $this->customer->id,
                    'name' => $this->customer->name,
                ];
            }),
            'professional' => $this->whenLoaded('professional', function () {
                return [
                    'id' => $this->professional->id,
                    'name' => $this->professional->name,
                ];
            }),
            'services' => $this->whenLoaded('services', function () {
                return $this->services->map(function ($service) {
                    return [
                        'id' => $service->id,
                        'name' => $service->name,
                        'servicePrice' => $service->pivot->service_price,
                        'commissionType' => $service->pivot->commission_type,
                        'commissionValue' => $service->pivot->commission_value,
                        'professionalId' => $service->pivot->professional_id,
                    ];
                });
            }),
            'date' => $this->date?->toDateString(),
            'time' => $this->start_time?->format('H:i:s'),
            'status' => $this->status,
            'totalPrice' => $this->total_price,
            'discountAmount' => $this->discount_amount,
            'finalPrice' => $this->final_price,
            'paymentMethod' => $this->payment_method,
            'promotion' => $this->whenLoaded('promotion', function () {
                return [
                    'id' => $this->promotion->id,
                    'name' => $this->promotion->name,
                ];
            }),
            'notes' => $this->notes,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
