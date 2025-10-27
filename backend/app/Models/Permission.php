<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    use HasFactory;

    protected $table = 'permissions';

    protected $fillable = [
        'role_id',
        'screen_id',
        'action_id',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function screen()
    {
        return $this->belongsTo(Screen::class);
    }

    public function action()
    {
        return $this->belongsTo(Action::class);
    }
}
