<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppointmentPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'method',
        'base_amount',
        'fee_percent',
        'fee_amount',
        'amount',
        'card_brand',
        'installments',
        'meta',
    ];

    protected $casts = [
        'appointment_id' => 'integer',
        'base_amount' => 'decimal:2',
        'fee_percent' => 'decimal:2',
        'fee_amount'  => 'decimal:2',
        'amount'      => 'decimal:2',
        'installments' => 'integer',
        'meta' => 'json',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}
