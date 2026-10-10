<?php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;

class AuditLogger
{
    public static function log(
        string $event,
        array $metadata = [],
        ?Model $subject = null,
        ?Authenticatable $actor = null,
    ): void {
        try {
            $actor ??= auth()->user();

            AuditLog::create([
                'actor_type' => $actor ? get_class($actor) : null,
                'actor_id' => $actor?->getKey(),
                'actor_email' => $actor?->email ?? null,
                'event' => $event,
                'subject_type' => $subject ? get_class($subject) : null,
                'subject_id' => $subject?->getKey(),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'metadata' => $metadata ?: null,
            ]);
        } catch (\Throwable $e) {
            // Never let audit logging break a request
            report($e);
        }
    }
}