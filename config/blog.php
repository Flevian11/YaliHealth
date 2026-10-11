<?php

return [
    'posts' => [
        [
            'slug' => 'sha-provider-portal-to-hmis-migration',
            'title' => "The Great Migration: Why Kenya's Hospitals Are Moving from the SHA Provider Portal to HMIS",
            'excerpt' => 'The Ministry of Health has ordered all 6,427 contracted health facilities to migrate from the SHA Provider Portal to a certified HMIS by October 30, 2026. Here is what changed, why it matters, and what hospitals need to do.',
            'category' => 'Compliance',
            'tags' => ['SHA', 'HMIS', 'DHA', 'compliance', 'digital health'],
            'author' => 'Flevian Ochoka',
            'author_role' => 'Founder & Lead Engineer',
            'read_minutes' => 9,
            'published_at' => '2026-10-11',
            'featured' => true,
            'cover_image' => '/images/blog/sha-hmis-migration.jpg',
            'cover_video' => 'https://www.youtube.com/watch?v=VIDEO_ID_HERE',
            'body' => [
                [
                    'type' => 'paragraph',
                    'content' => "On October 2, 2026, Health Cabinet Secretary Aden Duale issued a clarification that ended months of confusion in Kenya's health sector: every health facility contracted by the Social Health Authority (SHA) must migrate from the legacy SHA Provider Portal to a certified Health Management Information System (HMIS) by **October 30, 2026**.",
                ],
                [
                    'type' => 'image',
                    'src' => '/images/blog/duale-forum.jpg',
                    'caption' => 'CS Aden Duale chairs the consultative forum with healthcare provider associations at the Ministry of Health.',
                    'alt' => 'Health CS Aden Duale at the consultative forum',
                ],
                [
                    'type' => 'heading',
                    'level' => 2,
                    'content' => 'The problem with the old system',
                ],
                [
                    'type' => 'paragraph',
                    'content' => "Since SHA was established, hospitals have been running **two separate systems**: their own HMIS for day-to-day clinical operations and the SHA Provider Portal for claims and related transactions. This created real operational friction:",
                ],
                [
                    'type' => 'list',
                    'items' => [
                        'Staff had to re-enter the same patient data into two systems',
                        'Claims were delayed because they had to be manually reconstructed from clinical encounters',
                        'Verification was weak, leading to rejected claims and slow reimbursements',
                        'Patients waited longer while staff navigated disconnected workflows',
                    ],
                ],
                [
                    'type' => 'quote',
                    'content' => 'This has created additional administrative work for healthcare facilities and, in some instances, contributed to longer processing and waiting times for patients.',
                    'source' => 'CS Aden Duale, Ministry of Health',
                ],
                [
                    'type' => 'heading',
                    'level' => 2,
                    'content' => 'What is actually changing',
                ],
                [
                    'type' => 'paragraph',
                    'content' => "The hospital's HMIS becomes the **single primary system** for managing healthcare services and information. Instead of staff entering data into the HMIS and then transferring it to the SHA portal, the HMIS integrates directly with SHA and other health-sector systems through certified APIs.",
                ],
                [
                    'type' => 'callout',
                    'variant' => 'info',
                    'title' => 'Important',
                    'content' => "This is not a new system. It is part of the ongoing rollout of the digital superhighway and the already paid-for suite of SHA systems. The move does not do away with SHA or SHIF.",
                ],
                [
                    'type' => 'paragraph',
                    'content' => 'Under the new arrangement, hospital HMIS platforms are expected to integrate and communicate with SHA and other relevant health-sector systems, reducing the need for healthcare workers to repeatedly enter or transfer the same information.',
                ],
                [
                    'type' => 'heading',
                    'level' => 2,
                    'content' => 'Migration status: where hospitals stand',
                ],
                [
                    'type' => 'table',
                    'headers' => ['Facility type', 'Migrated', 'Remaining', 'Notes'],
                    'rows' => [
                        ['Level 2–4 public', '6,427', '0', 'Fully complete'],
                        ['Level 5 public', '4', '23', 'In progress'],
                        ['Faith-based (FBO)', '38', '480', 'Receiving technical support'],
                        ['Private', '28 certified', 'Ongoing', 'HMIS integration testing'],
                    ],
                ],
                [
                    'type' => 'paragraph',
                    'content' => "The DHA is executing Rapid Results Initiatives (RRI) throughout October, offering hands-on technical assistance, system certification, and operational support to remaining facilities.",
                ],
                [
                    'type' => 'heading',
                    'level' => 2,
                    'content' => 'What your HMIS needs to do',
                ],
                [
                    'type' => 'paragraph',
                    'content' => 'To be certified and integrated, your HMIS must connect to the HIE and support these workflows natively:',
                ],
                [
                    'type' => 'list',
                    'items' => [
                        '**Patient registry search** against the national MPI to get the CR number',
                        '**SHA eligibility checks** at the point of registration',
                        '**OTP or biometric consent** capture before sharing patient data',
                        '**ICD-11 diagnosis coding** for every encounter',
                        '**Real-time claims submission** via the HIE Claims API',
                        '**FHIR R4 bundle generation** for shared health records',
                        '**Immutable audit logging** of every PHI access',
                    ],
                ],
                [
                    'type' => 'video',
                    'src' => 'https://www.youtube.com/embed/VIDEO_ID_HERE',
                    'caption' => 'Watch: CS Duale explains the transition from the SHA Provider Portal to HMIS.',
                ],
                [
                    'type' => 'heading',
                    'level' => 2,
                    'content' => 'The deadline is real',
                ],
                [
                    'type' => 'paragraph',
                    'content' => "Facilities that fail to migrate by October 30 risk being locked out of the SHA scheme. The ministry has been explicit: this is not a suggestion. It is a regulatory requirement under the Digital Health Act.",
                ],
                [
                    'type' => 'callout',
                    'variant' => 'warning',
                    'title' => 'Deadline',
                    'content' => 'October 30, 2026 — all contracted facilities must be on a certified HMIS.',
                ],
            ],
        ],
        [
            'slug' => 'multi-tenant-hmis-postgresql-architecture',
            'title' => 'Building a Multi-Tenant HMIS on PostgreSQL: Architecture Decisions That Matter',
            'excerpt' => 'Schema-per-tenant isolation, Redis-backed HIE token storage, and queued API calls. How we designed YaliHealth to serve hundreds of hospitals from a single codebase.',
            'category' => 'Engineering',
            'tags' => ['postgresql', 'multi-tenancy', 'laravel', 'architecture'],
            'author' => 'Flevian Ochoka',
            'author_role' => 'Founder & Lead Engineer',
            'read_minutes' => 11,
            'published_at' => '2026-10-08',
            'featured' => false,
            'cover_image' => '/images/blog/multi-tenant-architecture.jpg',
            'body' => [
                [
                    'type' => 'paragraph',
                    'content' => "When you're building an HMIS for multiple hospitals, the first architectural decision you make is how to isolate their data. Get it wrong and you'll either leak PHI across tenants or spend every deploy fighting migration scripts.",
                ],
                [
                    'type' => 'heading',
                    'level' => 2,
                    'content' => 'Schema-per-tenant vs shared tables',
                ],
                [
                    'type' => 'paragraph',
                    'content' => "We chose **schema-per-tenant** on PostgreSQL. Each hospital gets its own schema (`tenant_nairobi_west`, `tenant_mombasa_clinic`), with all patient, clinical, and billing tables living inside it.",
                ],
                [
                    'type' => 'list',
                    'items' => [
                        '**Strong isolation** — a query cannot leak across tenants because the schema boundary is enforced by the database',
                        '**Predictable performance** — each hospital\'s indexes are sized to its own data volume, not the sum of all hospitals',
                        '**Simple compliance** — you can point to a specific schema when auditing or exporting a single hospital\'s data',
                        '**Manageable migrations** — `php artisan tenants:migrate` runs across all schemas with one command',
                    ],
                ],
                [
                    'type' => 'heading',
                    'level' => 2,
                    'content' => 'The stancl/tenancy gotcha',
                ],
                [
                    'type' => 'paragraph',
                    'content' => "We use `stancl/tenancy` to handle schema switching per request. It works well, but there's one trap: the `Tenant` model overrides Eloquent's attribute handling, routing new columns into a JSON `data` column instead of real DB columns.",
                ],
                [
                    'type' => 'code',
                    'language' => 'php',
                    'content' => "// This silently fails — plan_id ends up in the JSON data column
\$tenant->update(['plan_id' => 4]);

// This works — direct DB write hits the real column
DB::table('tenants')->where('id', \$tenant->id)->update(['plan_id' => 4]);",
                ],
                [
                    'type' => 'callout',
                    'variant' => 'info',
                    'title' => 'Rule of thumb',
                    'content' => 'Any write to a real column on the Tenant model must go through `DB::table(\'tenants\')`. Never trust `$tenant->update()` for real columns.',
                ],
                [
                    'type' => 'heading',
                    'level' => 2,
                    'content' => 'HIE token storage in Redis',
                ],
                [
                    'type' => 'paragraph',
                    'content' => "Every hospital has its own HIE `client_id` and `client_secret`. When they call the HIE, they get an `access_token` that expires. That token must be shared across every queue worker and web process for that tenant.",
                ],
                [
                    'type' => 'code',
                    'language' => 'php',
                    'content' => "Cache::put(
    \"hie:token:{\$tenant->id}\",
    \$accessToken,
    \$expiresIn - 60
);",
                ],
                [
                    'type' => 'paragraph',
                    'content' => "Redis is the right place for this. It's fast, it's shared across processes, and it has built-in TTL support so tokens expire automatically.",
                ],
                [
                    'type' => 'heading',
                    'level' => 2,
                    'content' => 'All HIE calls go through the queue',
                ],
                [
                    'type' => 'paragraph',
                    'content' => 'Claim submission, preauth creation, SHR bundle upload — none of these belong inline in a user\'s HTTP request. The HIE occasionally has slow responses or downtime. Your UI should not hang because of that.',
                ],
                [
                    'type' => 'paragraph',
                    'content' => 'Every HIE call is dispatched as a queued job through Laravel Horizon, with retry logic and exponential backoff.',
                ],
                [
                    'type' => 'heading',
                    'level' => 2,
                    'content' => 'What we would do differently',
                ],
                [
                    'type' => 'list',
                    'items' => [
                        'Add a per-tenant connection pool sooner — PgBouncer gets complicated at scale',
                        'Version the HIE API responses so we can detect breaking changes early',
                        'Build a shared "HIE client" package from day one instead of one service class',
                    ],
                ],
            ],
        ],
        [
            'slug' => 'hie-integration-developers-guide',
            'title' => "HIE Integration in Kenya: A Developer's Guide to the Health Information Exchange",
            'excerpt' => 'OAuth tokens, consent flows, FHIR bundles, and claims. Everything a developer needs to know about integrating with Kenya\'s national Health Information Exchange.',
            'category' => 'Engineering',
            'tags' => ['HIE', 'FHIR', 'API', 'integration', 'OAuth'],
            'author' => 'Flevian Ochoka',
            'author_role' => 'Founder & Lead Engineer',
            'read_minutes' => 13,
            'published_at' => '2026-10-05',
            'featured' => false,
            'cover_image' => '/images/blog/hie-integration.jpg',
            'body' => [
                [
                    'type' => 'paragraph',
                    'content' => "Kenya's Health Information Exchange (HIE) is the plumbing that connects hospitals to the national patient registry, consent management, claims processing, and shared health records. If you're building an HMIS that needs to work in Kenya, you need to understand how it works.",
                ],
                [
                    'type' => 'heading',
                    'level' => 2,
                    'content' => 'The eight modules you will interact with',
                ],
                [
                    'type' => 'table',
                    'headers' => ['Module', 'What it does', 'Key endpoints'],
                    'rows' => [
                        ['Authentication', 'Token issuance and refresh', 'POST /tenants/token'],
                        ['Registries', 'Patient, practitioner, facility search', 'GET /patients, /professionals, /facilities/search'],
                        ['Consent', 'OTP and biometric authorization', 'POST /claims/otp, /claims/authorize'],
                        ['Eligibility', 'SHA member validation', 'GET /patients/eligibility'],
                        ['Claims', 'Preauth and claim lifecycle', 'POST /preauths, /claims/visit, /claims/submit'],
                        ['SHR', 'FHIR R4 read/write', 'POST /shr/bundles, GET /shr/patient-records'],
                        ['Terminology', 'ICD-11 concept search', 'GET /clinical/concepts'],
                        ['Billing', 'Claim lines and attachments', 'POST /claims/lines, /claims/attachments'],
                    ],
                ],
                [
                    'type' => 'heading',
                    'level' => 2,
                    'content' => 'The consent token is the key',
                ],
                [
                    'type' => 'paragraph',
                    'content' => "Almost every action after patient lookup requires a `consent_token`. You get one by either sending the patient an OTP or capturing their biometric authorization. That token is then passed to claims, preauth, and SHR endpoints.",
                ],
                [
                    'type' => 'code',
                    'language' => 'php',
                    'content' => "// 1. Send OTP
\$otp = Http::post(\$hie . '/api/v1/claims/otp', [
    'patient_id' => \$patientId,
    'service_type' => 'OUTPATIENT',
]);

// 2. Verify OTP (user enters it)
\$consent = Http::post(\$hie . '/api/v1/claims/authorize', [
    'patient_id' => \$patientId,
    'otp' => \$userEnteredOtp,
    'interventions' => ['SHA-01-001'],
]);

// 3. Use the token
\$token = \$consent['consent_token'];",
                ],
                [
                    'type' => 'callout',
                    'variant' => 'warning',
                    'title' => 'Never cache consent tokens',
                    'content' => 'They expire quickly and are tied to a specific visit. Store them in Redis with a short TTL, never in your database.',
                ],
                [
                    'type' => 'heading',
                    'level' => 2,
                    'content' => 'FHIR bundles for the Shared Health Record',
                ],
                [
                    'type' => 'paragraph',
                    'content' => 'The SHR accepts FHIR R4 "collection" bundles. Every clinical resource in the bundle must reference an Encounter, and that Encounter must reference the visit\'s EpisodeOfCare.',
                ],
                [
                    'type' => 'code',
                    'language' => 'json',
                    'content' => "{
  \"resourceType\": \"Bundle\",
  \"type\": \"collection\",
  \"entry\": [
    { \"resource\": { \"resourceType\": \"Encounter\", ... } },
    { \"resource\": { \"resourceType\": \"Observation\", ... } },
    { \"resource\": { \"resourceType\": \"Condition\", ... } }
  ]
}",
                ],
                [
                    'type' => 'paragraph',
                    'content' => 'The bundle is sent with an `X-Consent-Token` header. The middleware only checks that the body is a Bundle — the contents are validated upstream by DHA.',
                ],
                [
                    'type' => 'heading',
                    'level' => 2,
                    'content' => 'What gets rejected and why',
                ],
                [
                    'type' => 'list',
                    'items' => [
                        'Free-text diagnoses instead of ICD-11 codes',
                        'Missing consent token on any claims or SHR call',
                        'Non-standard drug codes in prescriptions',
                        'Claim lines that don\'t reference a valid intervention code',
                        'FHIR resources that don\'t reference their Encounter',
                    ],
                ],
                [
                    'type' => 'heading',
                    'level' => 2,
                    'content' => 'Testing without credentials',
                ],
                [
                    'type' => 'paragraph',
                    'content' => 'The HIE team provides a UAT environment and a Postman collection. You can build and test your entire integration layer against the mock endpoints before you receive production credentials.',
                ],
                [
                    'type' => 'callout',
                    'variant' => 'info',
                    'title' => 'Pro tip',
                    'content' => 'Build a mock HIE server that returns realistic responses. It makes local development dramatically faster and lets you test edge cases like expired tokens and rejected claims.',
                ],
            ],
        ],
    ],

    'newsletter_email' => 'blog@yalihealth.co.ke',
];