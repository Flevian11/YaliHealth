<?php

namespace App\Services\Hie;

class ClaimsService
{
    public function __construct(
        private HieClient $client,
    ) {}

    public function createVisit(array $payload): array
    {
        $response = $this->call('POST', '/claims/visit', $payload);
        $snakified = HieArray::snakify($response);

        $token = $snakified['consent_token'] ?? null;

        if (empty($token)) {
            throw HieException::malformed('visit creation missing consent_token');
        }

        return [
            'consent_token' => (string) $token,
            'hie_visit_ref' => $snakified['hie_visit_ref'] ?? null,
            'status' => $snakified['status'] ?? 'CREATED',
            'raw' => $snakified,
        ];
    }

    public function addLine(array $payload): array
    {
        return HieArray::snakify($this->call('POST', '/claims/lines', $payload));
    }

    public function preview(string $consentToken): array
    {
        return HieArray::snakify(
            $this->call('POST', '/claims/preview', ['consent_token' => $consentToken]),
        );
    }

    public function submit(array $payload): array
    {
        return HieArray::snakify($this->call('POST', '/claims/submit', $payload));
    }

    public function discharge(array $payload): array
    {
        return HieArray::snakify($this->call('POST', '/claims/discharge', $payload));
    }

    public function requestDischargeOtp(string $consentToken, string $patientCrId): array
    {
        return HieArray::snakify($this->call('POST', '/claims/otp/discharge', [
            'consent_token' => $consentToken,
            'patient_id' => $patientCrId,
        ]));
    }

    public function close(string $consentToken): array
    {
        return HieArray::snakify($this->call('POST', '/claims/close', [
            'consent_token' => $consentToken,
        ]));
    }

    /**
     * Upload an attachment to an existing claim.
     *
     * @param  array  $payload  [
     *     'consent_token' => string,
     *     'document_type' => string,
     *     'intervention_code' => string,
     *     'file' => \Illuminate\Http\UploadedFile,
     * ]
     */
    public function addAttachment(array $payload): array
    {
        $file = $payload['file'] ?? null;

        if (! $file) {
            throw HieException::malformed('attachment upload missing file');
        }

        $fields = [
            'consent_token' => $payload['consent_token'] ?? '',
            'document_type' => $payload['document_type'] ?? 'OTHER',
            'intervention_code' => $payload['intervention_code'] ?? '',
        ];

        $response = $this->call(
            'POST',
            '/claims/attachments',
            $fields,
            [
                'multipart' => true,
                'attach' => [[
                    'name' => 'file_blob',
                    'contents' => $file->get(),
                    'filename' => $file->getClientOriginalName(),
                ]],
            ],
        );

        return HieArray::snakify($response);
    }

    private function call(string $method, string $path, array $payload = [], array $options = []): array
    {
        try {
            $response = $this->client->request($method, $path, $payload, $options);
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
                "{$method} {$path} failed",
            );
        }

        return $response->json() ?? [];
    }
}