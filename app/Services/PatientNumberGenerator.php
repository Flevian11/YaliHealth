<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PatientNumberGenerator
{
    /**
     * Character set excludes confusable characters:
     * 0/O, 1/I/L are omitted so codes survive phone calls,
     * handwriting, and OCR.
     */
    private const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

    private const CODE_LENGTH = 10;

    private const MAX_ATTEMPTS = 10;

    /**
     * Generate a unique patient number for the current tenant.
     *
     * Format: {FACILITY}-{10 CHAR CODE}
     * Example: KAK-QJK7Y2X9M3
     */
    public function next(): string
    {
        $prefix = $this->facilityPrefix(tenant());

        for ($attempt = 0; $attempt < self::MAX_ATTEMPTS; $attempt++) {
            $code = $this->generateCode();
            $number = "{$prefix}-{$code}";

            if (! $this->exists($number)) {
                return $number;
            }
        }

        // Fallback: if all attempts collided (essentially never), append
        // an extra character to increase entropy.
        return "{$prefix}-" . $this->generateCode() . random_int(0, 9);
    }

    private function generateCode(): string
    {
        $maxIndex = strlen(self::ALPHABET) - 1;
        $code = '';

        for ($i = 0; $i < self::CODE_LENGTH; $i++) {
            $code .= self::ALPHABET[random_int(0, $maxIndex)];
        }

        return $code;
    }

    private function exists(string $number): bool
    {
        return Patient::where('patient_number', $number)->exists();
    }

    /**
     * Derive a short facility prefix from the tenant.
     * "Kakamega County Hospital" → KAK
     * "Nairobi West Hospital"    → NAI
     * "yalipital_2"              → YAL
     * Falls back to "PAT" if we can't derive anything.
     */
    private function facilityPrefix(?Tenant $tenant): string
    {
        if (! $tenant) {
            return 'PAT';
        }

        // Prefer the tenant's configured prefix if set
        $configured = $tenant->facility_prefix ?? null;
        if (is_string($configured) && $configured !== '') {
            return strtoupper(substr($configured, 0, 3));
        }

        $name = $tenant->name ?? $tenant->id;

        // Take the first word of the hospital name, or fall back to the slug
        $parts = preg_split('/[\s_\-]+/', trim((string) $name));
        $first = $parts[0] ?? 'PAT';

        $prefix = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $first), 0, 3));

        return $prefix ?: 'PAT';
    }
}