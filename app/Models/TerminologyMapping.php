<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TerminologyMapping extends Model
{
    protected $fillable = [
        'source', 'from_code', 'to_code', 'to_source',
        'to_title', 'map_type', 'synced_at',
    ];

    protected $casts = [
        'synced_at' => 'datetime',
    ];
}