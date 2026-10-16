<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Role → permission mappings
    |--------------------------------------------------------------------------
    | Wildcards like `patients.*` expand to all keys with that prefix.
    */

    'roles' => [
        'hospital_admin' => ['*'],

        'doctor' => [
            'dashboard.view',
            'patients.*',
            'visits.*',
            'appointments.*',
            'encounters.*',
            'prescriptions.*',
            'lab_orders.*',
            'wards.view',
            'hie.registries.read',
            'hie.eligibility.read',
            'hie.consent.write',
            'hie.claims.view',
            'hie.claims.submit',
            'hie.shr.read',
            'hie.shr.write',
            'announcements.view',
        ],

        'nurse' => [
            'dashboard.view',
            'patients.view',
            'patients.create',
            'visits.view',
            'visits.create',
            'appointments.*',
            'encounters.view',
            'prescriptions.view',
            'wards.view',
            'wards.manage',
            'hie.registries.read',
            'hie.consent.write',
            'announcements.view',
        ],

        'receptionist' => [
            'dashboard.view',
            'patients.*',
            'visits.view',
            'visits.create',
            'appointments.*',
            'hie.registries.read',
            'hie.eligibility.read',
            'announcements.view',
        ],

        'billing' => [
            'dashboard.view',
            'patients.view',
            'visits.view',
            'visits.billing',
            'invoices.*',
            'remittances.*',
            'hie.claims.view',
            'hie.claims.submit',
            'announcements.view',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Human-readable catalog (shown in Staff & Users admin)
    |--------------------------------------------------------------------------
    */

    'catalog' => [
        'General' => [
            'dashboard.view' => 'Access dashboard',
            'announcements.view' => 'View announcements',
        ],
        'Patients' => [
            'patients.view' => 'View patient records',
            'patients.create' => 'Register patients',
            'patients.edit' => 'Edit patient records',
            'patients.delete' => 'Delete patient records',
        ],
        'Visits' => [
            'visits.view' => 'View visits',
            'visits.create' => 'Open new visits',
            'visits.consent' => 'Capture patient consent (OTP / biometrics)',
            'visits.billing' => 'Add billing lines and diagnoses',
            'visits.dispatch' => 'Submit claims and discharge patients',
            'visits.emergency' => 'Create emergency (ECCIF) claims',
        ],
        'Clinical' => [
            'appointments.view' => 'View appointments',
            'appointments.create' => 'Book appointments',
            'encounters.view' => 'View encounters',
            'encounters.create' => 'Create clinical encounters',
            'prescriptions.view' => 'View prescriptions',
            'prescriptions.create' => 'Write prescriptions',
            'lab_orders.view' => 'View lab orders',
            'lab_orders.create' => 'Create lab orders',
            'wards.view' => 'View wards and beds',
            'wards.manage' => 'Manage ward assignments',
        ],
        'HIE' => [
            'hie.registries.read' => 'Search national registries',
            'hie.eligibility.read' => 'Check SHA eligibility',
            'hie.consent.write' => 'Capture patient consent',
            'hie.claims.view' => 'View claims',
            'hie.claims.submit' => 'Submit claims to SHA',
            'hie.shr.read' => 'Read Shared Health Records',
            'hie.shr.write' => 'Write to Shared Health Records',
        ],
        'Finance' => [
            'invoices.view' => 'View invoices',
            'invoices.create' => 'Create invoices',
            'remittances.view' => 'View remittances',
            'reports.view' => 'View financial reports',
        ],
        'Administration' => [
            'hie.credentials' => 'Manage HIE credentials and secrets',
            'facility.manage' => 'Manage facility settings',
            'staff.manage' => 'Manage staff and users',
        ],
    ],
];