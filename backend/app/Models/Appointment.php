<?php

namespace App\Models;

use App\Enums\{AppointmentPaymentStatus, AppointmentStatus};
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};

class Appointment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_id',
        'date',
        'start_time',
        'end_time',
        'duration',
        'status',
        'payment_status',
        'total_price',
        'discount_amount',
        'discount_type',
        'final_price',
        'promotion_id', // remover mais tarde
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime:H:i:s',
        'end_time' => 'datetime:H:i:s',
        'status' => AppointmentStatus::class,
        'payment_status' => AppointmentPaymentStatus::class,
        'duration' => 'integer',
        'total_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'discount_type' => 'string',
        'final_price' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    // remover mais tarde
    public function promotion()
    {
        return $this->belongsTo(Promotion::class);
    }

    public function appointmentServices()
    {
        return $this->hasMany(AppointmentService::class);
    }

    public function services()
    {
        return $this->belongsToMany(Service::class, 'appointment_service')
            ->withPivot([
                'id',
                'service_price',
                'commission_type',
                'commission_value',
                'professional_id',
                'starts_at',
                'ends_at',
            ])
            ->withTimestamps();
    }

    public function items()
    {
        return $this->belongsToMany(Item::class, 'appointment_item')
            ->withPivot(['price', 'quantity'])
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

    public function payments()
    {
        return $this->hasMany(AppointmentPayment::class);
    }

    public function primaryPayment()
    {
        return $this->hasOne(AppointmentPayment::class)->latestOfMany();
    }
}
