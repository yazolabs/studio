<?php

namespace App\Http\Resources;

use App\Models\Professional;
use Carbon\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray($request): array
    {
        $professionalsMap = [];

        if ($this->relationLoaded('appointmentServices')) {
            $professionalIds = $this->appointmentServices
                ->pluck('professional_id')
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

        $mapPromo = function ($promo) {
            return [
                'id' => $promo->id,
                'name' => $promo->name,
                'discount_type' => $promo->discount_type?->value ?? (string) $promo->discount_type,
                'discount_value' => $promo->discount_value,
                'pivot' => [
                    'id' => $promo->pivot->id ?? null,
                    'sort_order' => $promo->pivot->sort_order ?? 0,
                    'applied_value' => $promo->pivot->applied_value,
                    'applied_percent' => $promo->pivot->applied_percent,
                    'discount_amount' => $promo->pivot->discount_amount,
                    'applied_by_user_id' => $promo->pivot->applied_by_user_id,
                ],
            ];
        };

        return [
            'id' => $this->id,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id'   => $this->customer->id,
                'name' => $this->customer->name,
            ]),
            'professionals' => $this->whenLoaded('appointmentServices', function () use ($professionalsMap) {
                $ids = $this->appointmentServices
                    ->pluck('professional_id')
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
            'appointment_services' => $this->whenLoaded('appointmentServices', function () use ($professionalsMap, $mapPromo) {
                return $this->appointmentServices->map(function ($aps) use ($professionalsMap, $mapPromo) {
                    $professionalId = $aps->professional_id;

                    $startsAtIso = $aps->starts_at ? Carbon::parse($aps->starts_at)->toISOString() : null;
                    $endsAtIso   = $aps->ends_at ? Carbon::parse($aps->ends_at)->toISOString() : null;

                    return [
                        'id' => $aps->id,
                        'appointment_id' => $aps->appointment_id,
                        'service_id' => $aps->service_id,
                        'service' => $aps->relationLoaded('service') && $aps->service ? [
                            'id' => $aps->service->id,
                            'name' => $aps->service->name,
                            'duration' => $aps->service->duration ?? null,
                        ] : null,
                        'service_price' => $aps->service_price,
                        'commission_type' => $aps->commission_type,
                        'commission_value' => $aps->commission_value,
                        'professional_id' => $professionalId,
                        'professional' => $professionalId
                            ? ($professionalsMap[$professionalId] ?? [
                                'id'   => $professionalId,
                                'name' => null,
                            ])
                            : null,
                        'starts_at' => $startsAtIso,
                        'ends_at'   => $endsAtIso,
                        'promotions' => $aps->relationLoaded('promotions')
                            ? $aps->promotions->map($mapPromo)->values()
                            : [],
                    ];
                });
            }),
            'services' => $this->whenLoaded('appointmentServices', function () use ($professionalsMap, $mapPromo) {
                return $this->appointmentServices->map(function ($aps) use ($professionalsMap, $mapPromo) {
                    $professionalId = $aps->professional_id;

                    $startsAtIso = $aps->starts_at ? Carbon::parse($aps->starts_at)->toISOString() : null;
                    $endsAtIso   = $aps->ends_at ? Carbon::parse($aps->ends_at)->toISOString() : null;

                    return [
                        'id'               => $aps->service_id,
                        'name'             => $aps->relationLoaded('service') && $aps->service ? $aps->service->name : null,
                        'service_price'    => $aps->service_price,
                        'commission_type'  => $aps->commission_type,
                        'commission_value' => $aps->commission_value,
                        'professional_id'  => $professionalId,
                        'professional'     => $professionalId
                            ? ($professionalsMap[$professionalId] ?? [
                                'id'   => $professionalId,
                                'name' => null,
                            ])
                            : null,
                        'starts_at'        => $startsAtIso,
                        'ends_at'          => $endsAtIso,
                        'duration'         => $aps->relationLoaded('service') && $aps->service ? ($aps->service->duration ?? null) : null,
                        'appointment_service_id' => $aps->id,
                        'promotions' => $aps->relationLoaded('promotions')
                            ? $aps->promotions->map($mapPromo)->values()
                            : [],
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
            'payments' => $this->whenLoaded('payments', fn () =>
                $this->payments->map(fn ($p) => [
                    'id'           => $p->id,
                    'method'       => $p->method,
                    'base_amount'  => $p->base_amount,
                    'fee_percent'  => $p->fee_percent,
                    'fee_amount'   => $p->fee_amount,
                    'amount'       => $p->amount,
                    'card_brand'   => $p->card_brand,
                    'installments' => $p->installments,
                    'meta'         => $p->meta,
                    'created_at'   => $p->created_at?->toISOString(),
                    'updated_at'   => $p->updated_at?->toISOString(),
                ])
            ),
            'payment_summary' => $this->whenLoaded('payments', function () {
                $grouped = $this->payments->groupBy('method');

                return $grouped->map(function ($rows, $method) {
                    $sumCents = 0;
                    foreach ($rows as $r) {
                        $sumCents += (int) round(((float) $r->amount) * 100);
                    }

                    return [
                        'method' => $method,
                        'amount' => number_format($sumCents / 100, 2, '.', ''),
                    ];
                })->values();
            }),
            'notes'      => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
