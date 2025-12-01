<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProfessionalOpenWindowResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'              => $this->id,
            'professional_id' => $this->professional_id,
            'start_date'      => $this->start_date?->toDateString(),
            'end_date'        => $this->end_date?->toDateString(),
            'status'          => $this->status,
            'created_at'      => $this->created_at?->toISOString(),
            'updated_at'      => $this->updated_at?->toISOString(),
        ];
    }
}
