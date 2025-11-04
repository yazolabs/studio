<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};
use Illuminate\Database\Eloquent\Casts\Attribute;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'customers';

    protected $fillable = [
        'name',
        'cpf',
        'gender',
        'active',
        'email',
        'phone',
        'alternate_phone',
        'address',
        'number',
        'complement',
        'neighborhood',
        'city',
        'state',
        'zip_code',
        'birth_date',
        'last_visit',
        'notes',
        'contact_preferences',
        'accepts_marketing',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'last_visit' => 'datetime',
        'contact_preferences' => 'array',
        'accepts_marketing' => 'boolean',
        'active' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS & MUTATORS
    |--------------------------------------------------------------------------
    | Esses métodos garantem que CPF, telefones e CEP sejam salvos limpos
    | e que possam ser formatados automaticamente ao serem exibidos.
    */

    protected function cpf(): Attribute
    {
        return Attribute::make(
            get: fn($value) => $this->formatCpf($value),
            set: fn($value) => $value ? preg_replace('/\D/', '', $value) : null,
        );
    }

    protected function phone(): Attribute
    {
        return Attribute::make(
            get: fn($value) => $this->formatPhone($value),
            set: fn($value) => $value ? preg_replace('/\D/', '', $value) : null,
        );
    }

    protected function alternatePhone(): Attribute
    {
        return Attribute::make(
            get: fn($value) => $this->formatPhone($value),
            set: fn($value) => $value ? preg_replace('/\D/', '', $value) : null,
        );
    }

    protected function zipCode(): Attribute
    {
        return Attribute::make(
            get: fn($value) => $this->formatCep($value),
            set: fn($value) => $value ? preg_replace('/\D/', '', $value) : null,
        );
    }

    /*
    |--------------------------------------------------------------------------
    | FORMAT HELPERS
    |--------------------------------------------------------------------------
    */
    private function formatCpf(?string $cpf): ?string
    {
        if (!$cpf || strlen($cpf) !== 11) return $cpf;
        return preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $cpf);
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

    private function formatCep(?string $cep): ?string
    {
        if (!$cep || strlen($cep) !== 8) return $cep;
        return preg_replace('/(\d{5})(\d{3})/', '$1-$2', $cep);
    }

    /*
    |--------------------------------------------------------------------------
    | RELACIONAMENTOS
    |--------------------------------------------------------------------------
    */
    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function commissions()
    {
        return $this->hasMany(Commission::class);
    }
}
