<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TerminologySyncJob extends Model
{
    protected $fillable = [
        'source', 'status',
        'concepts_fetched', 'concepts_created', 'concepts_updated',
        'mappings_created', 'duration_ms', 'error_message', 'meta',
        'triggered_by', 'trigger_source',
        'started_at', 'completed_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];
}