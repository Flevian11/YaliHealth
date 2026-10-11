<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoginOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $code,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your YaliHealth sign-in code',
        );
    }

    public function content(): Content
    {
        $tenant = tenant();
        $brand = config('app.name', 'YaliHealth');

        return new Content(
            view: 'emails.login-otp',
            with: [
                'user' => $this->user,
                'code' => $this->code,
                'expiryMinutes' => \App\Services\EmailOtpService::EXPIRY_MINUTES,
                'brand' => $brand,
                'hospitalName' => $tenant?->name ?? $tenant?->id ?? null,
            ],
        );
    }
}