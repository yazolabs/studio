<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};

class Professional extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'specialties',
        'active',
        'work_schedule',
    ];

    protected $casts = [
        'specialties' => 'array',
        'work_schedule' => 'array',
        'active' => 'boolean',
    ];

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function commissions()
    {
        return $this->hasMany(Commission::class);
    }

    public function accountsPayable()
    {
        return $this->hasMany(AccountPayable::class);
    }
}
