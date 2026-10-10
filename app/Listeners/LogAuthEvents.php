<?php

namespace App\Listeners;

use App\Support\AuditLogger;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;

class LogAuthEvents
{
    public function handleLogin(Login $event): void
    {
        AuditLogger::log('auth.login', ['guard' => $event->guard], null, $event->user);
    }

    public function handleFailed(Failed $event): void
    {
        AuditLogger::log('auth.failed', [
            'guard' => $event->guard,
            'email' => $event->credentials['email'] ?? null,
        ]);
    }

    public function handleLogout(Logout $event): void
    {
        AuditLogger::log('auth.logout', ['guard' => $event->guard], null, $event->user);
    }

    public function subscribe($events): void
    {
        $events->listen(Login::class, [self::class, 'handleLogin']);
        $events->listen(Failed::class, [self::class, 'handleFailed']);
        $events->listen(Logout::class, [self::class, 'handleLogout']);
    }
}