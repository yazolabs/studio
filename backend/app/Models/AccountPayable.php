<?php

namespace App\Models;

use App\Enums\AccountPayableStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AccountPayable extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'accounts_payable';

    protected $fillable = [
        'description',
        'amount',
        'due_date',
        'status',
        'category',
        'supplier_id',
        'professional_id',
        'appointment_id',
        'origin_type',
        'origin_id',
        'payment_date',
        'payment_method',
        'reference',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date',
        'status' => AccountPayableStatus::class,
        'payment_date' => 'date',
        'origin_id' => 'integer',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function professional()
    {
        return $this->belongsTo(Professional::class);
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function origin(): MorphTo
    {
        return $this->morphTo();
    }

    public function isPending(): bool
    {
        return $this->status->value === 'pending';
    }

    public function isFromCommission(): bool
    {
        return $this->origin_type === 'commission' && !empty($this->origin_id);
    }
}
