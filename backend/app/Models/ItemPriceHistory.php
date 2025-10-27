<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItemPriceHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'old_price',
        'new_price',
        'change_date',
        'changed_by',
        'reason',
    ];

    protected $casts = [
        'old_price' => 'decimal:2',
        'new_price' => 'decimal:2',
        'change_date' => 'datetime',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
