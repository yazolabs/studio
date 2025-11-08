<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class State extends Model
{
    use HasFactory;

    protected $table = 'states';

    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'id',
        'name',
        'uf',
    ];

    public $timestamps = false;
}
