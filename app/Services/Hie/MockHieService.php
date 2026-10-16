<?php

namespace App\Services\Hie;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class MockHieService
{
    public function handle(string $method, string $path, array $payload = [], array $options = []): Response
    {
        $this->simulateLatency();

        $fixture = $this->findFixture($method, $path, $payload);

        if ($fixture === null) {
            return $this->respond(404, [
                'error' => 'Not Found',
                'message' => "Mock HIE has no fixture for {$method} {$path}",
            ]);
        }

        // Explicit "not found" — the caller sees an empty results array,
        // which the UI interprets as "not in the national registry".
        if (($fixture['__empty_results'] ?? false) === true) {
            return $this->respond(200, [
                'count' => 0,
                'results' => [],
            ]);
        }

        $failureRate = (float) config('hie.mock.failure_rate', 0);
        if ($failureRate > 0 && random_int(1, 10000) <= $failureRate * 10000) {
            return $this->respond(503, [
                'error' => 'Service Unavailable',
                'message' => 'Simulated HIE failure',
            ]);
        }

        $data = $this->substitutePlaceholders($fixture, $path, $payload);

        return $this->respond(200, $data);
    }

    private function findFixture(string $method, string $path, array $payload = []): ?array
    {
        $root = (string) config('hie.mock.fixtures_path');

        if (! is_dir($root)) {
            return null;
        }

        // ── Patient registry lookup ─────────────────────────────────
        // GET /patients?identification_number=X  →  patients/X.json
        //                                      or patients/CR-X.json
        if ($this->isPatientLookup($path)) {
            $ident = $payload['identification_number']
                ?? $payload['patient_id']
                ?? null;

            if ($ident) {
                $candidates = [
                    "{$root}/patients/{$ident}.json",
                    "{$root}/patients/CR-{$ident}.json",
                ];

                foreach ($candidates as $file) {
                    if (File::exists($file)) {
                        return json_decode(File::get($file), true) ?? [];
                    }
                }

                // No fixture for this identifier → the record does not exist.
                return ['__empty_results' => true];
            }
        }

        // ── Slug-based lookup ───────────────────────────────────────
        $slug = $this->slugifyPath($path);
        $key = strtolower($method) . '_' . $slug;

        foreach ([
            "{$root}/{$key}.json",
            "{$root}/{$slug}.json",
            "{$root}/" . strtolower($method) . ".json",
        ] as $file) {
            if (File::exists($file)) {
                return json_decode(File::get($file), true) ?? [];
            }
        }

        // ── Folder-based fallback ───────────────────────────────────
        $folderFile = "{$root}/" . $this->folderFor($path) . "/" . strtolower($method) . ".json";
        if (File::exists($folderFile)) {
            return json_decode(File::get($folderFile), true) ?? [];
        }

        return null;
    }

    private function isPatientLookup(string $path): bool
    {
        // Only the top-level search endpoint resolves per-ID fixtures.
        // /patients/eligibility, /patients/sub-benefits, etc. fall through
        // to slug-based lookup.
        return in_array(
            $path,
            ['/patients', 'patients', '/api/v1/patients'],
            true,
        );
    }

    private function slugifyPath(string $path): string
    {
        $clean = preg_replace('#/api/v1#', '', $path);
        $parts = array_filter(explode('/', trim((string) $clean, '/')));

        $out = [];
        foreach ($parts as $part) {
            $out[] = is_numeric($part) ? '_id_' : Str::slug($part, '_');
        }

        return implode('_', $out) ?: 'root';
    }

    private function folderFor(string $path): string
    {
        $clean = preg_replace('#/api/v1#', '', $path);
        $first = explode('/', trim((string) $clean, '/'))[0] ?? 'root';

        return Str::slug($first, '_');
    }

    private function substitutePlaceholders(array $data, string $path, array $payload): array
    {
        $replacements = [
            '{{request_id}}' => (string) Str::uuid(),
            '{{now}}' => now()->toIso8601String(),
            '{{path}}' => $path,
            '{{patient_id}}' => $this->resolvePatientId($payload),
            '{{intervention_code}}' => $payload['intervention_code'] ?? 'SHA-01-001',
            '{{consent_token}}' => $payload['consent_token'] ?? 'MOCK-CONSENT-TOKEN',
            '{{auth_guid}}' => $payload['auth_guid']
                ?? '00000000-0000-0000-0000-000000000000',
        ];

        // Strip our internal sentinel before returning to the caller.
        unset($data['__empty_results']);

        return $this->walk(
            $data,
            fn ($value) => is_string($value) ? strtr($value, $replacements) : $value,
        );
    }

    private function resolvePatientId(array $payload): string
    {
        if (! empty($payload['patient_id'])) {
            return (string) $payload['patient_id'];
        }

        if (! empty($payload['identification_number'])) {
            return (string) $payload['identification_number'];
        }

        return 'TEST-CR-001';
    }

    private function walk(array $data, callable $fn): array
    {
        foreach ($data as $k => $v) {
            $data[$k] = is_array($v) ? $this->walk($v, $fn) : $fn($v);
        }

        return $data;
    }

    private function simulateLatency(): void
    {
        $min = (int) config('hie.mock.latency_ms_min', 0);
        $max = (int) config('hie.mock.latency_ms_max', 0);

        if ($max > 0) {
            usleep(random_int($min, $max) * 1000);
        }
    }

    private function respond(int $status, array $body): Response
    {
        return new Response(
            new \GuzzleHttp\Psr7\Response(
                $status,
                ['Content-Type' => 'application/json'],
                json_encode($body),
            ),
        );
    }
}