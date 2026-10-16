<?php

namespace App\Services\Hie;

class ConsentService
{
    public function __construct(
        private HieClient $client,
    ) {}

    /**
     * Fetch the patient's masked contacts. UI shows these to the operator
     * so they can confirm which number receives the OTP.
     *
     * @return array<int, array{id: string, masked: string, type: ?string, confirmed: bool}>
     *
     * @throws HieException
     */
    public function contacts(string $patientCrId): array
    {
        $response = $this->call('GET', '/patients/contacts', [
            'patient_id' => $patientCrId,
        ]);

        $snakified = HieArray::snakify($response);

        return collect($snakified['results'] ?? [])
            ->map(fn ($c) => [
                'id' => (string) ($c['id'] ?? ''),
                'masked' => $c['contact_value'] ?? '',
                'type' => $c['contact_type'] ?? null,
                'confirmed' => (bool) ($c['is_confirmed'] ?? false),
            ])
            ->all();
    }

    /**
     * Dispatch an OTP to the patient (or to a specific contact).
     *
     * @return array{status: string, message: ?string, expires_in: ?int, raw: array}
     *
     * @throws HieException
     */
    public function sendOtp(string $patientCrId, array $interventionCodes = [], ?string $contactId = null): array
    {
        $payload = [
            'patient_id' => $patientCrId,
        ];

        if (! empty($interventionCodes)) {
            $payload['intervention_codes'] = $interventionCodes;
        }

        if ($contactId) {
            $payload['contact_id'] = $contactId;
        }

        $response = $this->call('POST', '/claims/otp', $payload);
        $snakified = HieArray::snakify($response);

        return [
            'status' => $snakified['status'] ?? 'sent',
            'message' => $snakified['message'] ?? null,
            'expires_in' => $snakified['expires_in'] ?? null,
            'raw' => $snakified,
        ];
    }

    /**
     * Create a biometric authorization. Response includes a guid and
     * an iframe URL. The UI embeds the iframe and polls for the flip.
     *
     * @return array{guid: string, token: string, status: string, iframe_url: ?string, expires_in: ?int, raw: array}
     *
     * @throws HieException
     */
    public function createBiometricAuthorization(array $payload): array
    {
        $response = $this->call('POST', '/claims/authorize', $payload);
        $snakified = HieArray::snakify($response);

        if (empty($snakified['guid']) || empty($snakified['token'])) {
            throw HieException::malformed('biometric authorization missing guid or token');
        }

        return [
            'guid' => (string) $snakified['guid'],
            'token' => (string) $snakified['token'],
            'status' => $snakified['status'] ?? 'PENDING',
            'iframe_url' => $snakified['iframe_url'] ?? null,
            'expires_in' => $snakified['expires_in'] ?? null,
            'raw' => $snakified,
        ];
    }

    /**
     * Create an OTP-based authorization (used for elective preauths).
     *
     * @return array{token: string, status: string, raw: array}
     *
     * @throws HieException
     */
    public function createOtpAuthorization(string $patientCrId, string $otp): array
    {
        $response = $this->call('POST', '/claims/authorize', [
            'patient_id' => $patientCrId,
            'otp' => $otp,
        ]);

        $snakified = HieArray::snakify($response);

        if (empty($snakified['token'])) {
            throw HieException::malformed('OTP authorization missing token');
        }

        return [
            'token' => (string) $snakified['token'],
            'status' => $snakified['status'] ?? 'AUTHORIZED',
            'raw' => $snakified,
        ];
    }

    /**
     * Poll a biometric authorization once. No internal loop — the UI drives
     * the polling cadence so it can show a spinner and let the patient retry.
     *
     * @return array{status: string, authorized: bool, raw: array}
     *
     * @throws HieException
     */
    public function checkBiometricAuthorization(string $consentToken, string $guid): array
    {
        $response = $this->call('GET', '/claims/authorizations', [
            'token' => $consentToken,
            'guid' => $guid,
        ]);

        $snakified = HieArray::snakify($response);
        $status = (string) ($snakified['status'] ?? 'PENDING');

        return [
            'status' => $status,
            'authorized' => in_array($status, ['AUTHORIZED', 'AUTHORIZED_PENDING_VISIT'], true),
            'raw' => $snakified,
        ];
    }

    /* ───── Internals ───── */

    private function call(string $method, string $path, array $payload = []): array
    {
        try {
            $response = $this->client->request($method, $path, $payload);
        } catch (\Throwable $e) {
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