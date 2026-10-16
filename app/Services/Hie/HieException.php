<?php

namespace App\Services\Hie;

use RuntimeException;

class HieException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?int $httpStatus = null,
        public readonly ?array $body = null,
        public readonly string $reason = 'unknown',
    ) {
        parent::__construct($message);
    }

    public static function unreachable(string $detail): self
    {
        return new self(
            "HIE is unreachable: {$detail}",
            reason: 'unreachable',
        );
    }

    public static function unauthorized(): self
    {
        return new self(
            'HIE rejected the credentials. Check the tenant connection.',
            httpStatus: 401,
            reason: 'unauthorized',
        );
    }

    public static function notFound(string $what): self
    {
        return new self(
            "HIE did not find {$what}.",
            httpStatus: 404,
            reason: 'not_found',
        );
    }

    public static function rejected(int $status, ?array $body, string $fallback): self
    {
        $message = $body['message'] ?? $body['error'] ?? $fallback;

        return new self(
            "HIE rejected the request: {$message}",
            httpStatus: $status,
            body: $body,
            reason: 'rejected',
        );
    }

    public static function malformed(string $detail): self
    {
        return new self(
            "HIE returned an unexpected response: {$detail}",
            reason: 'malformed',
        );
    }

    public function isUnreachable(): bool
    {
        return $this->reason === 'unreachable';
    }

    public function isNotFound(): bool
    {
        return $this->reason === 'not_found';
    }

    public function userMessage(): string
    {
        return match ($this->reason) {
            'unreachable' => 'The national HIE is not responding. Please try again shortly.',
            'unauthorized' => 'This hospital\'s HIE credentials are not valid. Contact your administrator.',
            'not_found' => 'No record found in the national registry.',
            'rejected' => $this->getMessage(),
            'malformed' => 'The HIE returned an unexpected response. Contact support.',
            default => 'HIE request failed.',
        };
    }
}