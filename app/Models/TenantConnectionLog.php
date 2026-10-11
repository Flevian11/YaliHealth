<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantConnectionLog extends Model
{
    protected $fillable = [
        'tenant_id',
        'action',
        'status',
        'message',
        'meta',
        'actor_id',
        'actor_email',
        'ip_address',
    ];

    protected $casts = [
        'meta' => 'array',
    ];
}