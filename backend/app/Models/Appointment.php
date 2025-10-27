<?php

namespace App\Models;

use App\Enums\AppointmentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};

class Appointment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_id',
        'professional_id',
        'date',
        'start_time',
        'status',
        'total_price',
        'discount_amount',
        'final_price',
        'payment_method',
        'promotion_id',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime:H:i:s',
        'status' => AppointmentStatus::class,
        'total_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'final_price' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function professional()
    {
        return $this->belongsTo(Professional::class);
    }

    public function promotion()
    {
        return $this->belongsTo(Promotion::class);
    }

    public function services()
    {
        return $this->belongsToMany(Service::class, 'appointment_service')
            ->withPivot(['service_price', 'commission_type', 'commission_value', 'professional_id'])
            ->withTimestamps();
    }

    public function commissions()
    {
        return $this->hasMany(Commission::class);
    }

    public function accountsPayable()
    {
        return $this->hasMany(AccountPayable::class);
    }
}
