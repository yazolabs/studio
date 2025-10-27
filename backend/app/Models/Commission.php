<?php

namespace App\Models;

use App\Enums\{CommissionStatus, CommissionType};
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};

class Commission extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'professional_id',
        'appointment_id',
        'service_id',
        'customer_id',
        'date',
        'service_price',
        'commission_type',
        'commission_value',
        'commission_amount',
        'status',
        'payment_date',
    ];

    protected $casts = [
        'date' => 'date',
        'service_price' => 'decimal:2',
        'commission_type' => CommissionType::class,
        'commission_value' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'status' => CommissionStatus::class,
        'payment_date' => 'date',
    ];

    public function professional()
    {
        return $this->belongsTo(Professional::class);
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
