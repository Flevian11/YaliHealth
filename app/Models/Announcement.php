<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Announcement extends Model
{
    protected $fillable = [
        'title',
        'body',
        'category',
        'priority',
        'status',
        'target_type',
        'target_ids',
        'channels',
        'scheduled_at',
        'published_at',
        'expires_at',
        'created_by',
        'emails_sent',
        'emails_failed',
    ];

    protected $casts = [
        'target_ids' => 'array',
        'channels' => 'array',
        'scheduled_at' => 'datetime',
        'published_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function reads(): HasMany
    {
        return $this->hasMany(AnnouncementRead::class);
    }

    public function isPublished(): bool
    {
        return $this->status === 'published'
            && $this->published_at
            && $this->published_at->isPast()
            && (! $this->expires_at || $this->expires_at->isFuture());
    }
}