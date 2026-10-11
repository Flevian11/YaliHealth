<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferenceSyncJob extends Model
{
    protected $fillable = [
        'registry_key',
        'status',
        'records_fetched',
        'records_created',
        'records_updated',
        'records_failed',
        'duration_ms',
        'error_message',
        'meta',
        'triggered_by',
        'trigger_source',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];
}