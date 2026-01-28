<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\{Builder, Model};

class AppointmentService extends Model
{
    use HasFactory;

    protected $table = 'appointment_service';

    protected $fillable = [
        'appointment_id',
        'service_id',
        'professional_id',
        'service_price',
        'commission_type',
        'commission_value',
        'starts_at',
        'ends_at',
    ];

    protected $casts = [
        'service_price' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at'   => 'datetime',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function professional()
    {
        return $this->belongsTo(Professional::class);
    }

    public function commissions()
    {
        return $this->hasMany(Commission::class, 'appointment_service_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereHas('appointment', fn ($q) => $q->whereNull('deleted_at'));
    }

    public function promotions()
    {
        return $this->belongsToMany(Promotion::class, 'appointment_service_promotion')
            ->withPivot([
                'id',
                'sort_order',
                'applied_value',
                'applied_percent',
                'discount_amount',
                'applied_by_user_id',
                'created_at',
                'updated_at',
            ])
            ->withTimestamps()
            ->orderByPivot('sort_order');
    }
}
