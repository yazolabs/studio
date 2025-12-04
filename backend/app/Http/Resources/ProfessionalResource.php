<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProfessionalResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'            => $this->id,
            'user_id'       => $this->user_id,
            'name'          => $this->user?->name,
            'email'         => $this->user?->email,
            'phone'         => $this->phone,
            'specialties'   => $this->specialties,
            'active'        => $this->active,
            'work_schedule' => $this->work_schedule ?? [],
            'open_windows'  => ProfessionalOpenWindowResource::collection(
                $this->whenLoaded('openWindows')
            ),
            'created_at'    => $this->created_at?->toISOString(),
            'updated_at'    => $this->updated_at?->toISOString(),
        ];
    }
}
