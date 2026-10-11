<?php

namespace App\Jobs;

use App\Mail\AnnouncementMail;
use App\Models\Announcement;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendAnnouncementEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        public Announcement $announcement,
        public string $tenantId,
    ) {}

    public function handle(): void
    {
        $tenant = Tenant::find($this->tenantId);

        if (! $tenant) {
            Log::warning('announcement.email.skipped_tenant_missing', [
                'announcement_id' => $this->announcement->id,
                'tenant_id' => $this->tenantId,
            ]);
            $this->increment('emails_failed');
            return;
        }

        $email = trim((string) $tenant->admin_email);

        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Log::warning('announcement.email.skipped_invalid', [
                'announcement_id' => $this->announcement->id,
                'tenant_id' => $tenant->id,
                'email' => $email,
            ]);
            $this->increment('emails_failed');
            return;
        }

        try {
            Mail::to($email)->send(
                new AnnouncementMail($this->announcement, $tenant)
            );

            $this->increment('emails_sent');

            Log::info('announcement.email.sent', [
                'announcement_id' => $this->announcement->id,
                'tenant_id' => $tenant->id,
                'email' => $email,
            ]);
        } catch (Throwable $e) {
            // Swallow the error — one bad recipient must not affect siblings
            $this->increment('emails_failed');

            Log::warning('announcement.email.failed', [
                'announcement_id' => $this->announcement->id,
                'tenant_id' => $tenant->id,
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function increment(string $column): void
    {
        try {
            DB::table('announcements')
                ->where('id', $this->announcement->id)
                ->increment($column);
        } catch (Throwable $e) {
            Log::warning('announcement.email.counter_failed', [
                'announcement_id' => $this->announcement->id,
                'column' => $column,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function failed(Throwable $e): void
    {
        Log::error('announcement.email.job_failed', [
            'announcement_id' => $this->announcement->id,
            'tenant_id' => $this->tenantId,
            'error' => $e->getMessage(),
        ]);
    }
}