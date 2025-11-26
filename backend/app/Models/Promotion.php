<?php

namespace App\Models;

use App\Enums\{DiscountType, RecurrenceType};
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};

class Promotion extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'discount_type',
        'discount_value',
        'start_date',
        'end_date',
        'active',
        'min_purchase_amount',
        'max_discount',
        'is_recurring',
        'recurrence_type',
        'recurrence_weekdays',
        'recurrence_week_of_month',
        'recurrence_month',
        'recurrence_day_of_month',
    ];

    protected $casts = [
        'discount_type' => DiscountType::class,
        'discount_value' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'active' => 'boolean',
        'min_purchase_amount' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'is_recurring' => 'boolean',
        'recurrence_type' => RecurrenceType::class,
        'recurrence_weekdays' => 'array',
        'recurrence_week_of_month' => 'integer',
        'recurrence_month' => 'integer',
        'recurrence_day_of_month' => 'integer',
    ];

    public function services()
    {
        return $this->belongsToMany(Service::class, 'promotion_service');
    }

    public function items()
    {
        return $this->belongsToMany(Item::class, 'promotion_item');
    }
}
