<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,

            'customer' => $this->whenLoaded('customer', fn() => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
            ]),

            'professionals' => $this->whenLoaded('professionals', fn() =>
                $this->professionals->map(fn($professional) => [
                    'id' => $professional->id,
                    'name' => $professional->name,
                    'commission_percentage' => $professional->pivot->commission_percentage,
                    'commission_fixed' => $professional->pivot->commission_fixed,
                ])
            ),

            'services' => $this->whenLoaded('services', fn() =>
                $this->services->map(fn($service) => [
                    'id' => $service->id,
                    'name' => $service->name,
                    'service_price' => $service->pivot->service_price,
                    'commission_type' => $service->pivot->commission_type,
                    'commission_value' => $service->pivot->commission_value,
                    'professional_id' => $service->pivot->professional_id,
                    'duration' => $service->duration ?? null,
                ])
            ),

            'items' => $this->whenLoaded('items', fn() =>
                $this->items->map(fn($item) => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'price' => $item->pivot->price,
                    'quantity' => $item->pivot->quantity,
                ])
            ),

            'date' => $this->date?->toDateString(),
            'start_time' => $this->start_time?->format('H:i:s'),
            'end_time' => $this->end_time?->format('H:i:s'),
            'duration' => $this->duration,
            'status' => $this->status,

            'total_price' => $this->total_price,
            'discount_amount' => $this->discount_amount,
            'final_price' => $this->final_price,

            'payment_method' => $this->payment_method,
            'card_brand' => $this->card_brand,
            'installments' => $this->installments,
            'installment_fee' => $this->installment_fee,

            'promotion' => $this->whenLoaded('promotion', fn() => [
                'id' => $this->promotion->id,
                'name' => $this->promotion->name,
            ]),

            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
