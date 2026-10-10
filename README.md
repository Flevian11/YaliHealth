# YaliHealth

A multi-tenant Hospital Management Information System (HMIS) built for the Kenyan healthcare ecosystem. YaliHealth integrates natively with the national Health Information Exchange (HIE), supports DHA certification requirements, and serves multiple hospitals from a single deployment.

---

## What it is

YaliHealth is a SaaS platform where:

- The platform operator (Super Admin) onboards hospitals, manages subscriptions, monitors platform health, and audits activity.
- Each hospital (tenant) runs in complete data isolation on its own subdomain with its own administrator, staff, and settings.
- The platform integrates with Kenya's HIE for patient registries, consent management, claims processing, and shared health records.

Same codebase, one deployment, unlimited tenants.

---

## Architecture

### Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13, PHP 8.3 |
| Frontend | React 19, Inertia 3, TypeScript, Tailwind v4 |
| Database | PostgreSQL 18 (schema-per-tenant) |
| Cache / Queue / Sessions | Redis (Memurai on Windows, native on Linux) |
| Auth | Laravel Fortify (2FA, passkeys, email verification) |
| Multi-tenancy | stancl/tenancy v3 |
| Permissions | spatie/laravel-permission |
| Deployment | Vite + Laravel Forge / Deployer (planned) |

### Domain routing

| Environment | Public landing | Super Admin | Tenant |
|---|---|---|---|
| Development | localhost:8000 | admin.localhost:8000 | {slug}.localhost:8000 |
| Production | yourhmis.co.ke | admin.yourhmis.co.ke | {slug}.yourhmis.co.ke |

Routing is driven entirely by `.env` values. No code changes between environments.

    TENANCY_ADMIN_DOMAIN=admin.localhost
    TENANCY_TENANT_SUFFIX=localhost
    TENANCY_CENTRAL_DOMAINS=127.0.0.1,localhost,admin.localhost
    APP_DOMAIN=localhost

### Tenant isolation

- One PostgreSQL database, one schema per tenant (`tenant_nairobi_west`, `tenant_mombasa_clinic`, ...).
- Central tables (`tenants`, `domains`, `super_admins`, `audit_logs`, `settings`) live in the `public` schema.
- Tenant tables (`users`, `patients`, `encounters`, etc.) live inside each tenant schema.
- `stancl/tenancy` handles schema switching per request via middleware.
- Row-level security is enforced by schema boundaries - no query can leak across tenants.

### Tenant ID rules

Two rules that never change:

1. Internal tenant IDs use underscores - `nairobi_west`, `yalipital_2`. PostgreSQL schemas reject hyphens.
2. Public subdomains use hyphens - `nairobi-west`, `yalipital-2`. Hostnames read better with hyphens.

Both derive from the hospital name. If two hospitals are named "Yalipital", the second is automatically assigned `yalipital-2`.

---

## Features

### Super Admin console (admin.{domain})

| Module | Status | Description |
|---|---|---|
| Authentication | Done | Separate super_admin guard, isolated from tenant users |
| Dashboard | Done | Real-time deltas, 12-month trend, distribution donut, recent hospitals, recent activity |
| Hospitals | Done | Create, search, paginate, view details, add admins, suspend, activate, delete |
| Audit Logs | Done | Filterable, paginated log of every auth and system event |
| Onboarding | Soon | Guided tenant setup |
| Subscription Plans | Soon | Billing tiers per tenant |
| Feature Flags | Soon | Toggle modules per hospital |
| Super Admins | Soon | Multi-admin access to the platform |
| Roles & Permissions | Soon | Granular RBAC for platform staff |
| API Health | Soon | HIE uptime monitoring and diagnostics |
| Tenant Connections | Soon | HIE credential management per hospital |
| Terminology | Soon | ICD-11, LOINC, KNHTS reference data |
| Reference Data | Soon | Facility, practitioner, and drug registries |
| Announcements | Soon | Platform-wide notices to hospitals |

### Tenant console ({slug}.{domain})

| Module | Status | Description |
|---|---|---|
| Authentication | Soon | Hospital staff login, 2FA, passkeys |
| Patients | Soon | Registration, MPI verification, SHA eligibility |
| Appointments | Soon | Scheduling and queue management |
| Encounters | Soon | Clinical documentation with ICD-11 coding |
| Prescriptions | Soon | Standardized dosing and dispense |
| Claims & Preauths | Soon | Full claims lifecycle against SHA |
| Consent | Soon | OTP and biometric consent flows |
| Shared Health Records | Soon | FHIR R4 bundles to national SHR |
| Billing | Soon | Invoices, reconciliation, remittance |

---

## HIE Integration

YaliHealth is designed against the official Kenya HIE API specification. The integration layer will support:

- Authentication - OAuth 2.0 token management per tenant, stored in Redis
- Registries - Patient (MPI), Professional, and Facility lookups
- Consent Services - OTP and biometric consent lifecycle
- Eligibility - SHA member validation and benefit utilization
- Claims & Preauths - Full lifecycle including renal, oncology, and imaging preauths
- Shared Health Records - FHIR R4 read/write with per-visit consent tokens
- Terminology Service - ICD-11 concept search and mappings

All HIE calls run through a dedicated `HieClient` service, queued via Laravel Horizon, with per-tenant credential isolation and automatic retry.

---

## Audit logging

Every security-relevant action is written to the `audit_logs` table, on both the platform and tenant sides:

| Event | Trigger |
|---|---|
| auth.login | Successful sign-in |
| auth.logout | Explicit sign-out |
| auth.failed | Failed sign-in attempt |
| hospital.created | Tenant provisioned |
| hospital.suspended | Tenant suspended |
| hospital.activated | Tenant reactivated |
| hospital.deleted | Tenant destroyed |
| hospital.admin.created | Additional admin added to tenant |

Each record captures: actor type + ID + email, event name, subject, IP address, user agent, and JSON metadata. Logs are append-only and never updated or deleted by the application.

---

## Local development setup

### Prerequisites

- PHP 8.3+ with pdo_pgsql, pgsql, mbstring, openssl, curl, fileinfo, gd, bcmath, tokenizer, xml
- Composer 2.x
- Node.js 20+ and npm
- PostgreSQL 16+
- Redis (Memurai on Windows, redis-server on Linux/macOS)
- Git

### First-time setup

    git clone https://github.com/Flevian11/YaliHealth.git
    cd YaliHealth

    composer install
    npm install

    cp .env.example .env
    php artisan key:generate

    psql -U postgres -c "CREATE DATABASE yalihealth;"

    php artisan migrate
    php artisan tenants:migrate

    php artisan wayfinder:generate

    php artisan dev

Visit:

- Landing: http://localhost:8000
- Super Admin: http://admin.localhost:8000 - first user must be created via tinker

    \App\Models\SuperAdmin::create([
        'name' => 'Your Name',
        'email' => 'admin@yalihealth.local',
        'password' => 'changeme123',
    ]);

---

## Project structure

    app/
        Actions/              Business logic (ProvisionHospital)
        Http/
            Controllers/
                Admin/        Super Admin controllers
                Settings/     User settings
            Middleware/       Inertia, tenant-active, appearance
            Requests/         Form request validation
        Listeners/            Auth event listeners
        Models/               Tenant, Domain, SuperAdmin, User, AuditLog, Setting
        Providers/            App, Fortify, Tenancy
        Support/              AuditLogger helper

    database/
        migrations/           Central schema migrations
        migrations/tenant/    Tenant schema migrations

    resources/
        css/app.css           Tailwind + theme variables
        js/
            components/       UI primitives + shared components
            hooks/            React hooks
            layouts/          Admin, auth, app, settings
            pages/            Inertia pages
            routes/           Wayfinder-generated route helpers
        views/app.blade.php   Root template

    routes/
        admin.php             Super Admin (admin.{domain})
        tenant.php            Tenant ({slug}.{domain})
        web.php               Central landing (localhost)
        settings.php          User settings

---

## Compliance and certification

YaliHealth is designed against the DHA HMIS Certification Framework. Key requirements baked into the architecture:

- Data isolation - schema-per-tenant, enforced at the database layer
- Immutable audit trail - every read and write on PHI is logged
- Encryption at rest and in transit - PostgreSQL TDE, HTTPS-only
- ODPC registration - required for platform operation
- ICD-11 standardization - no free-text diagnoses anywhere
- Consent token discipline - every claim and SHR action requires a valid consent token

The path to certification runs in three phases:

1. Sandbox - build and test against DHA's sandbox credentials
2. UAT - demonstrate all HIE workflows to the integration team
3. Production - receive production credentials, onboard hospitals

---

## License

Proprietary. All rights reserved.

---

## Contact

Built by Flevian Ochoka (https://portfolio.yaliid.cloud). For platform inquiries, contact the YaliHealth team.