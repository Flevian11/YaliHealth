<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class PatientNumberGenerator
{
    /**
     * Generate the next patient number for the current tenant.
     * Format: {PREFIX}-{YEAR}-{SEQUENCE}
     * Example: KAK-2026-00042
     */
    public function next(): string
    {
        $tenant = tenant();
        $prefix = $this->facilityPrefix($tenant);
        $year = now()->year;

        $sequence = DB::transaction(function () use ($year) {
            $row = DB::table('patient_number_sequences')
                ->where('year', $year)
                ->lockForUpdate()
                ->first();

            if (! $row) {
                $id = DB::table('patient_number_sequences')->insertGetId([
                    'year' => $year,
                    'last_number' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                return 1;
            }

            $next = $row->last_number + 1;
            DB::table('patient_number_sequences')
                ->where('id', $row->id)
                ->update(['last_number' => $next, 'updated_at' => now()]);

            return $next;
        });

        return sprintf('%s-%d-%05d', $prefix, $year, $sequence);
    }

    private function facilityPrefix(?Tenant $tenant): string
    {
        if (! $tenant) return 'PAT';

        // Prefer the admin-defined prefix, fall back to a truncated slug
        $name = $tenant->name ?? $tenant->id;
        $parts = preg_split('/\s+/', trim($name));
        $prefix = strtoupper(substr($parts[0] ?? 'PAT', 0, 3));

        return preg_replace('/[^A-Z0-9]/', '', $prefix) ?: 'PAT';
    }
}