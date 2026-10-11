<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApiHealthCheck extends Model
{
    protected $fillable = [
        'endpoint_key',
        'endpoint_label',
        'method',
        'url',
        'category',
        'status',
        'latency_ms',
        'http_status',
        'error_message',
        'response_meta',
        'checked_at',
    ];

    protected $casts = [
        'response_meta' => 'array',
        'checked_at' => 'datetime',
    ];
}