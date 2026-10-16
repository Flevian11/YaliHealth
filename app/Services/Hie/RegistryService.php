<?php

namespace App\Services\Hie;

use Illuminate\Support\Facades\Log;

class RegistryService
{
    public function __construct(
        private HieClient $client,
    ) {}

    /**
     * Search the national patient registry (MPI).
     *
     * @return array{
     *     cr_number: string,
     *     sha_id: ?string,
     *     first_name: string,
     *     middle_name: ?string,
     *     last_name: string,
     *     date_of_birth: ?string,
     *     gender: ?string,
     *     phone: ?string,
     *     alive: bool,
     *     raw: array
     * }
     *
     * @throws HieException
     */
    /**
     * @return array{
     *     cr_number: string,
     *     sha_id: ?string,
     *     first_name: string,
     *     middle_name: ?string,
     *     last_name: string,
     *     date_of_birth: ?string,
     *     gender: ?string,
     *     phone: ?string,
     *     alive: bool,
     *     dependants: array<int, array{
     *         cr_number: string,
     *         first_name: string,
     *         middle_name: ?string,
     *         last_name: string,
     *         date_of_birth: ?string,
     *         gender: ?string,
     *         relationship: ?string,
     *     }>,
     *     raw: array
     * }
     */
    public function findPatient(string $identificationNumber, string $identificationType): array
    {
        $response = $this->call('GET', '/patients', [
            'identification_number' => $identificationNumber,
            'identification_type' => $identificationType,
        ]);

        $results = $response['results'] ?? [];

        if (empty($results)) {
            throw HieException::notFound("patient with {$identificationType} {$identificationNumber}");
        }

        $first = HieArray::snakify($results[0]);

        // Dependants: normalise sub-records. Each dependant has its own sub-CR.
        $dependants = collect($first['dependants'] ?? [])
            ->map(function ($d) {
                $row = HieArray::snakify($d);

                return [
                    'cr_number' => (string) ($row['id'] ?? ''),
                    'first_name' => $row['first_name'] ?? '',
                    'middle_name' => $row['middle_name'] ?? null,
                    'last_name' => $row['last_name'] ?? '',
                    'date_of_birth' => $row['date_of_birth'] ?? null,
                    'gender' => $row['gender'] ?? null,
                    'relationship' => $row['relationship'] ?? null,
                ];
            })
            ->filter(fn($d) => $d['cr_number'] !== '')
            ->values()
            ->all();

        return [
            'cr_number' => $first['id'] ?? throw HieException::malformed('patient record missing id'),
            'sha_id' => $first['sha_id'] ?? null,
            'first_name' => $first['first_name'] ?? '',
            'middle_name' => $first['middle_name'] ?? null,
            'last_name' => $first['last_name'] ?? '',
            'date_of_birth' => $first['date_of_birth'] ?? null,
            'gender' => $first['gender'] ?? null,
            'phone' => $first['phone'] ?? null,
            'alive' => (bool) ($first['alive'] ?? true),
            'dependants' => $dependants,
            'raw' => $first,
        ];
    }

    /**
     * Search the health worker registry.
     *
     * @return array<int, array{registration_number: string, full_name: string, regulator: ?string, raw: array}>
     */
    public function findProfessionals(
        string $identificationNumber,
        string $identificationType,
        ?string $regulator = null,
    ): array {
        $params = [
            'identification_number' => $identificationNumber,
            'identification_type' => $identificationType,
        ];

        if ($regulator) {
            $params['regulator'] = $regulator;
        }

        $response = $this->call('GET', '/professionals', $params);

        return collect($response['results'] ?? [])
            ->map(function ($item) {
                $row = HieArray::snakify($item);

                return [
                    'registration_number' => $row['registration_number'] ?? $row['id'] ?? '',
                    'full_name' => trim(
                        ($row['first_name'] ?? '') . ' ' .
                            ($row['middle_name'] ?? '') . ' ' .
                            ($row['last_name'] ?? '')
                    ),
                    'regulator' => $row['regulator'] ?? null,
                    'raw' => $row,
                ];
            })
            ->all();
    }

    /**
     * Search the facility registry.
     *
     * @return array<int, array{facility_code: string, name: string, raw: array}>
     */
    public function findFacilities(string $identifier, string $identifierType): array
    {
        $response = $this->call('GET', '/facilities/search', [
            'identifier' => $identifier,
            'identifier_type' => $identifierType,
        ]);

        return collect($response['results'] ?? [])
            ->map(function ($item) {
                $row = HieArray::snakify($item);

                return [
                    'facility_code' => $row['id'] ?? $row['fr_code'] ?? '',
                    'name' => $row['name'] ?? '',
                    'raw' => $row,
                ];
            })
            ->all();
    }

    /* ───── Internals ───── */

    private function call(string $method, string $path, array $payload = []): array
    {
        try {
            $response = $this->client->request($method, $path, $payload);
        } catch (\Throwable $e) {
            Log::warning('hie.registry.transport_failed', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            throw HieException::unreachable($e->getMessage());
        }

        if ($response->status() === 401 || $response->status() === 403) {
            throw HieException::unauthorized();
        }

        if ($response->failed()) {
            throw HieException::rejected(
                $response->status(),
                $response->json(),
                "{$method} {$path} failed"
            );
        }

        return $response->json() ?? [];
    }
}
