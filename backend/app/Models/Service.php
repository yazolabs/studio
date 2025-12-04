<?php

namespace App\Models;

use App\Enums\CommissionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};

class Service extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'price',
        'duration',
        'category',
        'commission_type',
        'commission_value',
        'active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'duration' => 'integer',
        'commission_type' => CommissionType::class,
        'commission_value' => 'decimal:2',
        'active' => 'boolean',
    ];

    public function appointments()
    {
        return $this->belongsToMany(Appointment::class, 'appointment_service')
            ->withPivot([
                'service_price',
                'commission_type',
                'commission_value',
                'professional_id',
                'starts_at',
                'ends_at',
            ])
            ->withTimestamps();
    }

    public function promotions()
    {
        return $this->belongsToMany(Promotion::class, 'promotion_service');
    }
}
