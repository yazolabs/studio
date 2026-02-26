<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $table = 'users';

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'cashier_pin_hash',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'cashier_pin_set_at' => 'datetime',
        ];
    }

    public function hasCashierPin(): bool
    {
        return !empty($this->cashier_pin_hash);
    }

    public function checkCashierPin(string $pin): bool
    {
        return $this->hasCashierPin() && Hash::check($pin, (string) $this->cashier_pin_hash);
    }

    public function setCashierPin(string $pin): void
    {
        $this->forceFill([
            'cashier_pin_hash' => Hash::make($pin),
            'cashier_pin_set_at' => now(),
        ])->save();
    }

    public function clearCashierPin(): void
    {
        $this->forceFill([
            'cashier_pin_hash' => null,
            'cashier_pin_set_at' => null,
        ])->save();
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_user')->withTimestamps();
    }

    public function hasRole($role)
    {
        return $this->roles()->where('slug', $role)->exists();
    }

    public function hasPermission(string $screenSlug, string $actionSlug): bool
    {
        return $this->roles()
            ->whereHas('permissions', function ($query) use ($screenSlug, $actionSlug) {
                $query->whereHas('screen', function ($q) use ($screenSlug) {
                    $q->where('slug', $screenSlug);
                })->whereHas('action', function ($q) use ($actionSlug) {
                    $q->where('slug', $actionSlug);
                });
            })->exists();
    }
    
    public function isAdmin()
    {
        return $this->hasRole('admin');
    }

    public function professional()
    {
        return $this->hasOne(Professional::class);
    }

    public function professionalId(): ?int
    {
        return $this->professional?->id;
    }
}
