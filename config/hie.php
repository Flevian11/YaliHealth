<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Environment
    |--------------------------------------------------------------------------
    |
    | One of: mock | uat | production
    |
    | mock        → local fixtures, no network, deterministic
    | uat         → DHA UAT middleware
    | production  → DHA production middleware
    */

    'environment' => env('HIE_ENVIRONMENT', 'mock'),

    /*
    |--------------------------------------------------------------------------
    | Base URLs per environment
    |--------------------------------------------------------------------------
    */

    'base_urls' => [
        'mock' => env('APP_URL', 'http://localhost:8000') . '/mock-hie/api/v1',
        'uat' => env('HIE_UAT_URL', 'https://ilm-dev.dha.go.ke/uat-middleware/api/v1'),
        'production' => env('HIE_PROD_URL', 'https://ilm.dha.go.ke/api/v1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Request settings
    |--------------------------------------------------------------------------
    */

    'timeout_seconds' => env('HIE_TIMEOUT', 30),
    'connect_timeout_seconds' => env('HIE_CONNECT_TIMEOUT', 5),
    'retry_attempts' => env('HIE_RETRY_ATTEMPTS', 3),
    'retry_base_delay_ms' => env('HIE_RETRY_DELAY', 500),

    /*
    |--------------------------------------------------------------------------
    | Token cache
    |--------------------------------------------------------------------------
    */

    'token_cache_key' => 'hie:token:tenant:%s',
    'token_refresh_buffer_seconds' => 60,

    /*
    |--------------------------------------------------------------------------
    | Facility context
    |--------------------------------------------------------------------------
    |
    | 'jwt'      → facility comes from the token's facility_id claim (default)
    | 'headers'  → send X-Facility-Id and X-Facility-Id-Type on every request
    |
    */

    'facility_context' => env('HIE_FACILITY_CONTEXT', 'jwt'),

    /*
    |--------------------------------------------------------------------------
    | Mock behaviour
    |--------------------------------------------------------------------------
    |
    | Latency injected into mock responses so the UI is exercised realistically.
    */

    'mock' => [
        'latency_ms_min' => 60,
        'latency_ms_max' => 250,
        'failure_rate' => 0.0, // 0 = never fail; set to 0.05 to simulate flakiness
        'fixtures_path' => database_path('hie-mocks'),
    ],
];