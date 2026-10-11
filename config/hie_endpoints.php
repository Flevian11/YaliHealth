<?php

return [
    'groups' => [
        'auth' => [
            'label' => 'Authentication',
            'description' => 'Token issuance and session validation.',
            'endpoints' => [
                'auth.token' => [
                    'label' => 'Access Token',
                    'method' => 'POST',
                    'path' => '/api/v1/tenants/token',
                    'expects' => [200, 400, 401, 422], // 400+ means API is reachable
                    'timeout' => 10,
                ],
            ],
        ],
        'registries' => [
            'label' => 'Registries',
            'description' => 'Patient, professional, and facility lookups.',
            'endpoints' => [
                'registry.patients' => [
                    'label' => 'Patient Search',
                    'method' => 'GET',
                    'path' => '/api/v1/patients',
                    'expects' => [200, 400, 401, 403, 404],
                    'timeout' => 10,
                ],
                'registry.professionals' => [
                    'label' => 'Professionals Search',
                    'method' => 'GET',
                    'path' => '/api/v1/professionals',
                    'expects' => [200, 400, 401, 403, 404],
                    'timeout' => 10,
                ],
                'registry.facilities' => [
                    'label' => 'Facility Search',
                    'method' => 'GET',
                    'path' => '/api/v1/facilities/search',
                    'expects' => [200, 400, 401, 403, 404],
                    'timeout' => 10,
                ],
            ],
        ],
        'eligibility' => [
            'label' => 'Eligibility & Benefits',
            'description' => 'SHA member validation and benefit checks.',
            'endpoints' => [
                'eligibility.check' => [
                    'label' => 'SHA Eligibility Check',
                    'method' => 'GET',
                    'path' => '/api/v1/patients/eligibility',
                    'expects' => [200, 400, 401, 403, 404],
                    'timeout' => 15,
                ],
                'eligibility.benefits' => [
                    'label' => 'Sub-benefits Coverage',
                    'method' => 'GET',
                    'path' => '/api/v1/patients/sub-benefits',
                    'expects' => [200, 400, 401, 403, 404],
                    'timeout' => 15,
                ],
            ],
        ],
        'claims' => [
            'label' => 'Claims & Preauths',
            'description' => 'Billing, preauthorization, and claims lifecycle.',
            'endpoints' => [
                'claims.preauths' => [
                    'label' => 'Preauthorization',
                    'method' => 'GET',
                    'path' => '/api/v1/preauths',
                    'expects' => [200, 400, 401, 403, 404],
                    'timeout' => 20,
                ],
                'claims.visits' => [
                    'label' => 'Visit Initiation',
                    'method' => 'POST',
                    'path' => '/api/v1/claims/visit',
                    'expects' => [200, 201, 400, 401, 403, 422],
                    'timeout' => 20,
                ],
            ],
        ],
        'shr' => [
            'label' => 'Shared Health Records',
            'description' => 'FHIR-based clinical data exchange.',
            'endpoints' => [
                'shr.bundles' => [
                    'label' => 'FHIR Bundle Submit',
                    'method' => 'POST',
                    'path' => '/api/v1/shr/bundles',
                    'expects' => [200, 201, 400, 401, 403, 422],
                    'timeout' => 30,
                ],
                'shr.records' => [
                    'label' => 'Patient Records Read',
                    'method' => 'GET',
                    'path' => '/api/v1/shr/patient-records',
                    'expects' => [200, 400, 401, 403, 404],
                    'timeout' => 30,
                ],
            ],
        ],
        'clinical' => [
            'label' => 'Terminology',
            'description' => 'ICD-11 concept lookup and mappings.',
            'endpoints' => [
                'clinical.concepts' => [
                    'label' => 'Concept Search',
                    'method' => 'GET',
                    'path' => '/api/v1/clinical/concepts',
                    'expects' => [200, 400, 401, 403, 404],
                    'timeout' => 10,
                ],
            ],
        ],
    ],
];