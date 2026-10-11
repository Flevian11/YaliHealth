<?php

namespace App\Mail;

use App\Models\Announcement;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AnnouncementMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Announcement $announcement,
        public Tenant $tenant,
    ) {}

    public function envelope(): Envelope
    {
        $prefix = match ($this->announcement->priority) {
            'urgent' => '[Urgent] ',
            'high' => '[Important] ',
            default => '',
        };

        return new Envelope(
            subject: $prefix . $this->announcement->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.announcement',
            with: [
                'title' => $this->announcement->title,
                'body' => $this->announcement->body,
                'category' => $this->announcement->category,
                'priority' => $this->announcement->priority,
                'hospitalName' => $this->tenant->name ?? $this->tenant->id,
                'brand' => config('app.name', 'YaliHealth'),
            ],
        );
    }
}