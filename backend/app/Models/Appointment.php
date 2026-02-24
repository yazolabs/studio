<?php

namespace App\Models;

use App\Enums\{AppointmentPaymentStatus, AppointmentStatus};
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\{Builder, Model, SoftDeletes};

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
        'notes',
        'group_id',
        'group_sequence',
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
        'group_id' => 'string',
        'group_sequence' => 'integer',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
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

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->hasRole('admin')) return $query;

        if ($user->hasRole('professional')) {
            $pid = $user->professionalId();

            return $query->whereHas('appointmentServices', function ($q) use ($pid) {
                $q->where('professional_id', $pid ?? -1);
            });
        }

        return $query->whereRaw('1=0');
    }
}
