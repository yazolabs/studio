<?php

namespace App\Http\Resources;

use App\Models\Professional;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray($request): array
    {
        $professionalsMap = [];

        if ($this->relationLoaded('services')) {
            $professionalIds = $this->services
                ->pluck('pivot.professional_id')
                ->filter()
                ->unique()
                ->values()
                ->all();

            if (!empty($professionalIds)) {
                $professionalsMap = Professional::with('user')
                    ->whereIn('id', $professionalIds)
                    ->get()
                    ->mapWithKeys(function ($prof) {
                        return [
                            $prof->id => [
                                'id'   => $prof->id,
                                'name' => $prof->user->name ?? $prof->name ?? null,
                            ],
                        ];
                    })
                    ->toArray();
            }
        }

        return [
            'id' => $this->id,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id'   => $this->customer->id,
                'name' => $this->customer->name,
            ]),
            'professionals' => $this->whenLoaded('services', function () use ($professionalsMap) {
                $ids = $this->services
                    ->pluck('pivot.professional_id')
                    ->filter()
                    ->unique()
                    ->values()
                    ->all();

                return collect($ids)->map(function ($id) use ($professionalsMap) {
                    return $professionalsMap[$id] ?? [
                        'id'   => $id,
                        'name' => null,
                    ];
                });
            }),
            'services' => $this->whenLoaded('services', function () use ($professionalsMap) {
                return $this->services->map(function ($service) use ($professionalsMap) {
                    $professionalId = $service->pivot->professional_id;

                    return [
                        'id'               => $service->id,
                        'name'             => $service->name,
                        'service_price'    => $service->pivot->service_price,
                        'commission_type'  => $service->pivot->commission_type,
                        'commission_value' => $service->pivot->commission_value,
                        'professional_id'  => $professionalId,
                        'professional'     => $professionalId
                            ? ($professionalsMap[$professionalId] ?? [
                                'id'   => $professionalId,
                                'name' => null,
                            ])
                            : null,
                        'starts_at'        => $service->pivot->starts_at,
                        'ends_at'          => $service->pivot->ends_at,
                        'duration'         => $service->duration ?? null,
                    ];
                });
            }),
            'items' => $this->whenLoaded('items', fn () =>
                $this->items->map(fn ($item) => [
                    'id'       => $item->id,
                    'name'     => $item->name,
                    'price'    => $item->pivot->price,
                    'quantity' => $item->pivot->quantity,
                ])
            ),
            'date'       => $this->date?->toDateString(),
            'start_time' => $this->start_time?->format('H:i:s'),
            'end_time'   => $this->end_time?->format('H:i:s'),
            'duration'   => $this->duration,
            'status'         => $this->status?->value,
            'payment_status' => $this->payment_status?->value,
            'total_price'     => $this->total_price,
            'discount_type'   => $this->discount_type,
            'discount_amount' => $this->discount_amount,
            'final_price'     => $this->final_price,
            'payment_method'  => $this->payment_method,
            'card_brand'      => $this->card_brand,
            'installments'    => $this->installments,
            'installment_fee' => $this->installment_fee,
            'promotion_id' => $this->promotion_id,
            'promotion' => $this->whenLoaded('promotion', fn () => [
                'id'   => $this->promotion->id,
                'name' => $this->promotion->name,
            ]),
            'notes'      => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
