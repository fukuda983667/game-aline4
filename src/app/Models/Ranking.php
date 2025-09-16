<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ranking extends Model
{
    use HasFactory;

    protected $fillable = [
        'year_month',
        'player_name',
        'wins'
    ];

    protected $casts = [
        'wins' => 'integer'
    ];
}
