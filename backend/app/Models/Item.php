<?php

namespace App\Models;

use App\Enums\CommissionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};

class Item extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'price',
        'cost',
        'stock',
        'min_stock',
        'category',
        'supplier_id',
        'barcode',
        'commission_type',
        'commission_value',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'cost' => 'decimal:2',
        'stock' => 'integer',
        'min_stock' => 'integer',
        'commission_type' => CommissionType::class,
        'commission_value' => 'decimal:2',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function promotions()
    {
        return $this->belongsToMany(Promotion::class, 'promotion_item');
    }

    public function priceHistories()
    {
        return $this->hasMany(ItemPriceHistory::class);
    }

    public function appointments()
    {
        return $this->belongsToMany(Appointment::class, 'appointment_item')
            ->withPivot(['price', 'quantity'])
            ->withTimestamps();
    }
}
