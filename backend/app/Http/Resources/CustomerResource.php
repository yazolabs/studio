<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray($request): array
    {
        $user = $request->user();
        $isProfessional = $user?->hasRole('professional') === true;

        if ($isProfessional) {
            return [
                'id'   => $this->id,
                'name' => $this->name,
            ];
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'cpf' => $this->cpf,
            'gender' => $this->gender,
            'active' => $this->active,
            'email' => $this->email,
            'phone' => $this->phone,
            'alternate_phone' => $this->alternate_phone,
            'address' => $this->address,
            'number' => $this->number,
            'complement' => $this->complement,
            'neighborhood' => $this->neighborhood,
            'city' => $this->city,
            'state' => $this->state,
            'zip_code' => $this->zip_code,
            'birth_date' => $this->birth_date?->toDateString(),
            'last_visit' => $this->last_visit?->toISOString(),
            'notes' => $this->notes,
            'contact_preferences' => $this->contact_preferences ?? [],
            'accepts_marketing' => $this->accepts_marketing,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
