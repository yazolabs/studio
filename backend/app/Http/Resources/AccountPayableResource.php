<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\AccountPayable */
class AccountPayableResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'description' => $this->description,
            'amount' => $this->amount,
            'dueDate' => $this->due_date?->toDateString(),
            'status' => $this->status,
            'category' => $this->category,
            'supplierId' => $this->supplier_id,
            'professionalId' => $this->professional_id,
            'appointmentId' => $this->appointment_id,
            'paymentDate' => $this->payment_date?->toDateString(),
            'paymentMethod' => $this->payment_method,
            'reference' => $this->reference,
            'notes' => $this->notes,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
