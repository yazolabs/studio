<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};

class Action extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'actions';

    protected $fillable = [
        'name',
        'slug',
    ];

    public function permissions()
    {
        return $this->hasMany(Permission::class);
    }
}
