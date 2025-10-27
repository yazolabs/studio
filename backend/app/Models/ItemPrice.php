<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItemPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'price',
        'cost',
        'margin',
        'effective_date',
        'notes',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'cost' => 'decimal:2',
        'margin' => 'decimal:2',
        'effective_date' => 'date',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
