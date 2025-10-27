<?php

namespace App\Models;

use App\Enums\TransactionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};

class CashierTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'date',
        'type',
        'category',
        'description',
        'amount',
        'payment_method',
        'reference',
        'user_id',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'type' => TransactionType::class,
        'amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
