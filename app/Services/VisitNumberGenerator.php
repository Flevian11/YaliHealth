<?php

namespace App\Services;

use App\Models\Visit;

class VisitNumberGenerator
{
    private const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    private const CODE_LENGTH = 8;
    private const MAX_ATTEMPTS = 10;

    public function next(): string
    {
        $prefix = $this->facilityPrefix();

        for ($attempt = 0; $attempt < self::MAX_ATTEMPTS; $attempt++) {
            $number = "{$prefix}-V-{$this->generateCode()}";

            if (! Visit::where('visit_number', $number)->exists()) {
                return $number;
            }
        }

        return "{$prefix}-V-" . $this->generateCode() . random_int(0, 9);
    }

    private function generateCode(): string
    {
        $max = strlen(self::ALPHABET) - 1;
        $code = '';

        for ($i = 0; $i < self::CODE_LENGTH; $i++) {
            $code .= self::ALPHABET[random_int(0, $max)];
        }

        return $code;
    }

    private function facilityPrefix(): string
    {
        $tenant = tenant();
        $name = $tenant?->name ?? $tenant?->id ?? 'PAT';
        $parts = preg_split('/[\s_\-]+/', trim((string) $name));
        $first = $parts[0] ?? 'PAT';
        $prefix = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $first), 0, 3));

        return $prefix ?: 'PAT';
    }
}