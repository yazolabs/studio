<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};
use Illuminate\Database\Eloquent\Casts\Attribute;

class Professional extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
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

    protected function phone(): Attribute
    {
        return Attribute::make(
            get: fn($value) => $this->formatPhone($value),
            set: fn($value) => $value ? preg_replace('/\D/', '', $value) : null,
        );
    }

    private function formatPhone(?string $phone): ?string
    {
        if (!$phone) return $phone;

        $digits = preg_replace('/\D/', '', $phone);

        if (strlen($digits) === 11) {
            return preg_replace('/(\d{2})(\d{5})(\d{4})/', '($1) $2-$3', $digits);
        }

        if (strlen($digits) === 10) {
            return preg_replace('/(\d{2})(\d{4})(\d{4})/', '($1) $2-$3', $digits);
        }

        return $phone;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

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
