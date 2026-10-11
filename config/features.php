<?php

return [
    'groups' => [
        'clinical' => [
            'label' => 'Clinical',
            'features' => [
                'patients' => 'Patient Registry',
                'appointments' => 'Appointments & Scheduling',
                'encounters' => 'Clinical Encounters',
                'prescriptions' => 'Prescriptions & Dispensing',
                'orders' => 'Lab & Imaging Orders',
                'wards' => 'Wards & Bed Management',
            ],
        ],
        'hie' => [
            'label' => 'HIE Integration',
            'features' => [
                'hie.registries' => 'HIE Patient Registry',
                'hie.consent' => 'HIE Consent Services',
                'hie.eligibility' => 'SHA Eligibility Checks',
                'hie.claims' => 'HIE Claims & Preauths',
                'hie.shr' => 'Shared Health Records',
                'hie.terminology' => 'Terminology Service',
            ],
        ],
        'billing' => [
            'label' => 'Billing & Finance',
            'features' => [
                'billing.invoices' => 'Invoicing',
                'billing.reconciliation' => 'Remittance Reconciliation',
                'billing.reports' => 'Financial Reports',
            ],
        ],
        'platform' => [
            'label' => 'Platform',
            'features' => [
                'platform.api' => 'API Access',
                'platform.audit' => 'Audit Logs',
                'platform.users' => 'Multi-user Access',
                'platform.reports' => 'Advanced Reporting',
                'platform.integrations' => 'Third-party Integrations',
            ],
        ],
    ],
];