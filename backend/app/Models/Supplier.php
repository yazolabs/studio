<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'trade_name',
        'cnpj',
        'cpf',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'zip_code',
        'contact_person',
        'payment_terms',
        'notes',
    ];

    public function items()
    {
        return $this->hasMany(Item::class);
    }

    public function accountsPayable()
    {
        return $this->hasMany(AccountPayable::class);
    }
}
