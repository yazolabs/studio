<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Customer */
class CustomerResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'alternatePhone' => $this->alternate_phone,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'zipCode' => $this->zip_code,
            'birthDate' => $this->birth_date?->toDateString(),
            'notes' => $this->notes,
            'lastVisit' => $this->last_visit?->toISOString(),
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
