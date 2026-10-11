<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferenceRecord extends Model
{
    protected $fillable = [
        'registry_key',
        'external_id',
        'code',
        'name',
        'category',
        'status',
        'data',
        'synced_at',
    ];

    protected $casts = [
        'data' => 'array',
        'synced_at' => 'datetime',
    ];

    public function scopeForRegistry($q, string $key)
    {
        return $q->where('registry_key', $key);
    }
}