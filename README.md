# YaliHealth

A multi-tenant Hospital Management Information System (HMIS) built for the Kenyan healthcare ecosystem. YaliHealth integrates natively with the national Health Information Exchange (HIE), supports DHA certification requirements, and serves multiple hospitals from a single deployment.

---

## What it is

YaliHealth is a SaaS platform where:

- **The platform operator** (Super Admin) onboards hospitals, manages subscription plans, monitors platform health, and audits activity across every tenant.
- **Each hospital** (tenant) runs in complete data isolation on its own subdomain with its own administrator, staff, patients, and configuration.
- **The platform integrates** with Kenya's HIE for patient registries, consent management, SHA eligibility, claims processing, and shared health records.

Same codebase, one deployment, unlimited tenants.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13, PHP 8.3 |
| Frontend | React 19, Inertia 3, TypeScript, Tailwind v4 |
| Database | PostgreSQL 18 (schema-per-tenant) |
| Cache / Queue / Sessions | Redis (Memurai on Windows, native on Linux) |
| Auth | Laravel Fortify (2FA, passkeys, email OTP) |
| Multi-tenancy | stancl/tenancy v3 |
| Permissions | spatie/laravel-permission (platform) + custom role permissions (tenant) |
| Charts | Recharts |
| Route generation | Laravel Wayfinder |
| Deployment | Vite + Laravel Forge / Deployer (planned) |

---

## Domain routing

| Environment | Public landing | Super Admin | Tenant |
|---|---|---|---|
| Development | `localhost:8000` | `admin.localhost:8000` | `{slug}.localhost:8000` |
| Production | `yourhmis.co.ke` | `admin.yourhmis.co.ke` | `{slug}.yourhmis.co.ke` |

Routing is driven entirely by `.env` values. No code changes between environments.

```
TENANCY_ADMIN_DOMAIN=admin.localhost
TENANCY_TENANT_SUFFIX=localhost
TENANCY_CENTRAL_DOMAINS=127.0.0.1,localhost,admin.localhost
APP_DOMAIN=localhost
```

### Route loading order

In `bootstrap/app.php`, routes are registered in this order to guarantee correct precedence:

1. **Central** (`routes/web.php`) — scoped to `localhost`
2. **Admin** (`routes/admin.php`) — scoped to `admin.localhost`
3. **Tenant** (`routes/tenant.php`) — no domain constraint; tenancy middleware identifies by subdomain

Central routes are registered first because Fortify registers `/login`, `/register`, etc. on every domain. Our central `/login` overrides Fortify on `localhost`, and Fortify handles `/login` on tenant subdomains.

---

## Tenant isolation

- **One PostgreSQL database**, one **schema per tenant** (`tenant_nairobi_west`, `tenant_mombasa_clinic`, …).
- Central tables (`tenants`, `domains`, `plans`, `super_admins`, `audit_logs`, `settings`, `tenant_connections`, `announcements`, `login_handoff_tokens`) live in the `public` schema.
- Tenant tables (`users`, `patients`, `patient_number_sequences`, `settings`, `audit_logs`) live inside each tenant schema.
- `stancl/tenancy` handles schema switching per request via middleware.
- Row-level isolation is enforced by the schema boundary — no query can leak across tenants.

### Tenant ID rules

Two rules that never change:

1. **Internal tenant IDs use underscores** — `nairobi_west`, `yalipital_2`. PostgreSQL schemas reject hyphens.
2. **Public subdomains use hyphens** — `nairobi-west`, `yalipital-2`. Hostnames read better with hyphens.

Both derive from the hospital name. If two hospitals are named "Yalipital", the second is automatically assigned `yalipital-2`.

### Central vs tenant queries

Any model that lives in the **central** schema must be queried through `tenancy()->central()` when running inside a tenant request. This includes `Tenant`, `Domain`, `Plan`, `TenantConnection`, `SuperAdmin`, and `Announcement`.

```php
$connection = tenancy()->central(
    fn () => TenantConnection::where('tenant_id', $tenant->id)->first()
);
```

### The stancl/tenancy trap

The `Tenant` model overrides Eloquent's attribute handling, routing real columns into the JSON `data` column. Any write to a real column on the `Tenant` model must go through `DB::table('tenants')`:

```php
// Silently routes into JSON data — DON'T
$tenant->update(['plan_id' => 4]);

// Hits the real column — DO
DB::table('tenants')->where('id', $tenant->id)->update(['plan_id' => 4]);
```

This applies to `plan_id`, `subscription_status`, `trial_ends_at`, `current_period_start`, `current_period_end`, and `feature_overrides`.

---

## Authentication

### Three separate auth surfaces

| Surface | Domain | Guard | Table |
|---|---|---|---|
| Super Admin | `admin.localhost` | `super_admin` | `super_admins` (central) |
| Hospital staff | `{slug}.localhost` | `web` | `users` (per tenant) |
| Universal | `localhost` | none | cross-domain handoff to tenant |

### Super Admin authentication

- Email + password
- Optional 2FA (Fortify)
- Passkey support
- First super admin is auto-promoted to `owner` role by migration
- Cannot delete yourself
- Cannot demote or deactivate the last owner

### Hospital staff authentication

Two-step for password sign-ins:

1. Email + password → verified against the tenant's `users` table
2. **Email OTP** — a 6-digit code sent to the user's email (10-minute expiry, 30-second resend cooldown)

Passkey sign-ins skip OTP entirely (biometric verified by the browser).

### Universal login on the central domain

If a hospital staff member visits `localhost:8000/login` (the landing page login), the system:

1. Searches every tenant for the email
2. Verifies the password against the tenant's user record
3. Generates a **single-use handoff token** stored in `login_handoff_tokens` with a 60-second TTL
4. Renders a loading screen with the hospital name and an animated progress bar
5. Browser navigates to `{tenant}.{domain}/auth/adopt/{token}`
6. Tenant-side endpoint validates the token, marks it used, and logs the user in

The token is opaque — no user ID, tenant ID, or signature is exposed in the URL.

### Registration

- **Central `/register`** → redirects to `/get-started` (invite-only info page)
- **Tenant `/register`** → shows staff access info page with the hospital admin's contact details
- Hospital admins can create staff accounts (module coming soon)

---

## Super Admin console

Accessed at `admin.{domain}`.

### Modules

| Module | Status | Description |
|---|---|---|
| Authentication | ✅ | Separate guard, email OTP, passkeys, 2FA |
| Dashboard | ✅ | Platform metrics, activity trend, connection health, plan distribution, event types, top admins, recent hospitals, recent activity |
| Hospitals | ✅ | Create, search, paginate, view details, add admins, suspend, activate, change plan, delete |
| Plans | ✅ | Full CRUD with billing cycles, setup fees, feature entitlements |
| Feature Flags | ✅ | Per-plan toggles with per-hospital override support |
| Onboarding | ✅ | Four-step wizard: hospital → plan → admin → review |
| Super Admins | ✅ | Role-based user management with owner protection |
| Roles & Permissions | ✅ | Custom roles with granular permission catalog |
| Announcements | ✅ | Multi-channel messaging with targeting (all / plan / tenant), email delivery, read tracking |
| API Health | ✅ | Live endpoint monitoring with latency, uptime, and status history |
| Reference Data | ✅ | Sync and browse national registries (facilities, practitioners, terminology, interventions, drugs, schemes) |
| Terminology | ✅ | ICD-11 concepts, parent/child hierarchy, synonyms, source metadata |
| Tenant Connections | ✅ | Per-tenant HIE credentials, encrypted storage, health testing |
| Audit Logs | ✅ | Filterable, paginated log of every auth and system event |

### Permission model

Super Admins have roles: `owner` (wildcard), `admin` (most features), `viewer` (read-only).

Routes are protected by `perm:key` middleware. Keys are defined in `config/permissions.php` and grouped into: Hospitals, Plans, Features, Announcements, Admins, Roles, Audit, Settings.

---

## Hospital (tenant) console

Accessed at `{slug}.{domain}`.

### Modules

| Module | Status | Description |
|---|---|---|
| Authentication | ✅ | Email + password + OTP, passkeys, per-staff permissions |
| Dashboard | ✅ | Rich welcome banner, 4 stat cards with sparklines, patient registration trend, insurance mix, module grid, recent activity, recent patients, onboarding checklist |
| Patients | ✅ | Search, paginate, register with national ID / SHA ID / next of kin |
| Announcements | ✅ | Read-only view of announcements targeting this hospital |
| Settings | ✅ | Landing page with links to Profile, Security, Appearance |
| Staff & Users | 🚧 Soon | Add and manage hospital staff accounts |
| HIE Credentials | 🚧 Soon | Tenant admin view of their own HIE connection |
| Facility Settings | 🚧 Soon | Hospital-wide defaults |
| Clinical modules | 🚧 Soon | Encounters, prescriptions, lab orders, wards |
| Finance modules | 🚧 Soon | Invoices, remittances, reports |

### Tenant roles

Defined in `config/tenant_permissions.php`:

| Role | Scope |
|---|---|
| `hospital_admin` | Wildcard — all permissions |
| `doctor` | Patients, clinical, prescriptions, HIE read/write, claims |
| `nurse` | Patients view/create, appointments, encounters view, wards |
| `receptionist` | Patients, appointments, HIE registries/eligibility |
| `billing` | Invoices, remittances, claims view/submit |

Sidebar items are filtered by permission. A nurse will not see "HIE Credentials" or "Staff & Users."

---

## HIE Integration

The platform integrates with Kenya's Health Information Exchange for:

- **Authentication** — OAuth 2.0 token management per tenant, cached in Redis
- **Registries** — Patient (MPI), Professional, and Facility lookups
- **Consent Services** — OTP and biometric consent lifecycle
- **Eligibility** — SHA member validation and benefit utilization
- **Claims & Preauths** — Full lifecycle including renal, oncology, and imaging
- **Shared Health Records** — FHIR R4 read/write with per-visit consent tokens
- **Terminology** — ICD-11 concept search and mappings

All HIE calls run through a dedicated service layer, queued via Laravel Horizon, with per-tenant credential isolation and automatic retry.

### API Health monitoring

The platform polls 11 endpoints across 6 categories every 5 minutes:

- Authentication (1)
- Registries (3)
- Eligibility & Benefits (2)
- Claims & Preauths (2)
- Shared Health Records (2)
- Terminology (1)

Each check records latency, HTTP status, and reachability. Results drive the dashboard, list views, and detail pages with latency charts and status timelines.

---

## Audit logging

Every security-relevant action is written to `audit_logs`, on both the central and tenant sides.

| Event | Trigger |
|---|---|
| `auth.login`, `auth.logout`, `auth.failed` | Authentication |
| `auth.login.otp_challenge_issued`, `auth.login.otp_verified`, `auth.login.otp_resent` | OTP flow |
| `auth.login.passkey` | Passkey sign-in |
| `auth.login.cross_domain_issued`, `auth.login.cross_domain_adopted` | Universal login handoff |
| `hospital.created`, `hospital.suspended`, `hospital.activated`, `hospital.deleted` | Tenant lifecycle |
| `hospital.plan.changed`, `hospital.subscription.status.changed` | Subscription changes |
| `hospital.admin.created` | Staff onboarding |
| `plan.created`, `plan.updated`, `plan.deleted` | Plans |
| `plan.feature.toggled`, `plan.features.bulk_toggled` | Feature flags |
| `role.created`, `role.updated`, `role.deleted` | Roles |
| `super_admin.created`, `super_admin.updated`, `super_admin.deleted` | Platform admins |
| `announcement.created`, `announcement.updated`, `announcement.published`, `announcement.deleted` | Announcements |
| `tenant_connection.created`, `tenant_connection.updated`, `tenant_connection.toggled`, `tenant_connection.deleted` | HIE credentials |
| `patient.created` | Patient registration |
| `settings.updated` | Platform settings |

Each record captures: actor type + ID + email, event name, subject, IP address, user agent, and JSON metadata. Logs are append-only.

---

## Announcements

Announcements support:

- **Categories** — general, billing, usage, feature, advert, maintenance
- **Priorities** — low, normal, high, urgent
- **Targeting** — all hospitals, by plan, or specific hospitals
- **Channels** — in-app and email
- **Scheduling** — draft, scheduled, published, expired states
- **Read tracking** — reads per hospital stored in `announcement_reads`
- **Email delivery** — queued per hospital via `SendAnnouncementEmail`, invalid addresses are skipped without affecting siblings

Tenants see their targeting-relevant announcements at `/announcements` and via the notification bell in the header.

---

## Appearance

A floating palette button on the right edge of every tenant page opens a panel to switch between **Light**, **Dark**, and **System** themes. The choice persists in `localStorage` and applies via a `class` on `<html>`.

The admin console also respects the appearance preference but uses a separate local storage key so each context remembers its own choice.

---

## Local development setup

### Prerequisites

- PHP 8.3+ with `pdo_pgsql`, `pgsql`, `mbstring`, `openssl`, `curl`, `fileinfo`, `gd`, `bcmath`, `tokenizer`, `xml`
- Composer 2.x
- Node.js 20+ and npm
- PostgreSQL 16+
- Redis (Memurai on Windows, `redis-server` on Linux/macOS)
- Git

### First-time setup

```bash
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
```

### Environment essentials

```env
APP_NAME=YaliHealth
APP_URL=http://localhost:8000
APP_DOMAIN=localhost

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=yalihealth
DB_USERNAME=postgres
DB_PASSWORD=

SESSION_DRIVER=redis
SESSION_DOMAIN=null
QUEUE_CONNECTION=redis
CACHE_STORE=redis
REDIS_CLIENT=predis

TENANCY_ADMIN_DOMAIN=admin.localhost
TENANCY_TENANT_SUFFIX=localhost
TENANCY_CENTRAL_DOMAINS=127.0.0.1,localhost,admin.localhost

MAIL_MAILER=log
```

`SESSION_DOMAIN=null` is required in development. Chrome rejects cookies scoped to `.localhost`.

### Development URLs

- **Landing:** `http://localhost:8000`
- **Super Admin:** `http://admin.localhost:8000`
- **Tenant:** `http://{slug}.localhost:8000`
- **Central login:** `http://localhost:8000/login` (universal login)
- **Tenant login:** `http://{slug}.localhost:8000/login` (OTP flow)

### Running the dev stack

```bash
php artisan dev
```

Runs three processes concurrently: `php artisan serve`, `queue:listen`, and `npm run dev` (Vite).

### Creating the first Super Admin

```bash
php artisan tinker
```

```php
\App\Models\SuperAdmin::create([
    'name' => 'Your Name',
    'email' => 'admin@yalihealth.local',
    'password' => 'changeme123',
    'role' => 'owner',
]);
```

The migration `2026_10_10_000009_promote_owner_and_add_email_tracking` also promotes the earliest existing admin to `owner` if none exists.

### Seeding demo data

```bash
php artisan db:seed --class=PlanSeeder
php artisan db:seed --class=HospitalSeeder
```

`PlanSeeder` creates Monthly, Semi-Annual, and Yearly plans with a KES 10,000 setup fee.

`HospitalSeeder` provisions 10 hospitals across a mix of plans, subscription states, and statuses.

---

## Project structure

```
app/
    Actions/
        ProvisionHospital.php            Tenant provisioning with duplicate-name handling
    Console/Commands/
        PruneLoginHandoffTokens.php
        PruneApiHealthChecks.php
    Http/
        Controllers/
            Admin/                       Super Admin console
            Auth/                        Universal login, OTP, cross-domain handoff
            Settings/                    User settings (profile, security, appearance)
            Tenant/                      Hospital console
            LandingController.php        Marketing pages
        Middleware/
            EnsureFeatureEnabled.php     Plan + override feature gate
            EnsureSuperAdminHasPermission.php
            EnsureTenantIsActive.php     Blocks suspended/expired tenants
            HandleAppearance.php
            HandleInertiaRequests.php    Shares auth, theme, features, tenant permissions
        Responses/
            LoginResponse.php            Intercepts Fortify login for OTP
    Jobs/
        RunApiHealthChecks.php
        SendAnnouncementEmail.php
        SyncReferenceRegistry.php
        SyncTerminologySource.php
    Listeners/
        LogAuthEvents.php
        RecordLoginActivity.php
    Mail/
        AnnouncementMail.php
        LoginOtpMail.php
    Models/
        Announcement.php
        AnnouncementRead.php
        ApiHealthCheck.php
        AuditLog.php
        Domain.php
        LoginHandoffToken.php
        Patient.php
        Plan.php
        ReferenceRecord.php
        ReferenceSyncJob.php
        Role.php
        Setting.php
        SuperAdmin.php
        Tenant.php
        TenantConnection.php
        TenantConnectionLog.php
        TerminologyConcept.php
        TerminologyMapping.php
        TerminologySyncJob.php
        User.php
    Services/
        ApiHealthChecker.php
        EmailOtpService.php
        LoginHandoffService.php
        PatientNumberGenerator.php
        ReferenceSyncService.php
        TenantConnectionTester.php
        TerminologySyncService.php
    Support/
        ApiHealthBatch.php
        AuditLogger.php
        Features.php
        ReferenceSyncBatch.php
        Settings.php
        TenantPermissions.php

config/
    blog.php                             Marketing blog posts
    careers.php                          Open positions
    features.php                         Feature catalog
    hie_endpoints.php                    API health targets
    permissions.php                      Super Admin permission catalog
    reference.php                        Reference registries
    settings.php                         Platform settings schema
    tenancy.php                          stancl/tenancy config
    tenant_permissions.php               Tenant role catalog

database/
    migrations/                          Central schema
    migrations/tenant/                   Per-tenant schema
    seeders/
        PlanSeeder.php
        HospitalSeeder.php

resources/
    css/app.css                          Tailwind v4 + theme tokens
    js/
        components/
            marketing/                   Site header, footer, legal shell
            ui/                          shadcn primitives
            appearance-widget.tsx
            manage-passkeys.tsx
            manage-two-factor.tsx
            notifications-popover.tsx
            pagination.tsx
        hooks/
            use-features.ts
            use-permissions.ts           Super admin permissions
            use-tenant-permissions.ts
            use-relative-time.ts
        layouts/
            admin-layout.tsx
            app-layout.tsx
            auth-layout.tsx
            marketing-layout.tsx
            tenant-layout.tsx
            settings/layout.tsx
        lib/
            relative-time.ts
            utils.ts
        pages/
            admin/
                ApiHealth.tsx
                ApiHealthDetail.tsx
                Announcements.tsx
                Dashboard.tsx
                FeatureFlags.tsx
                Hospitals.tsx
                Login.tsx
                Onboarding.tsx
                Plans.tsx
                Profile.tsx
                ReferenceData.tsx
                ReferenceDataDetail.tsx
                Roles.tsx
                Settings.tsx
                SuperAdmins.tsx
                TenantConnectionDetail.tsx
                TenantConnections.tsx
                Terminology.tsx
                TerminologyDetail.tsx
            auth/
                login.tsx
                register.tsx
                request-access.tsx
                verify-otp.tsx
                redirecting.tsx
                forgot-password.tsx
                reset-password.tsx
                confirm-password.tsx
                verify-email.tsx
                two-factor-challenge.tsx
            marketing/
                blog.tsx
                careers.tsx
                contact.tsx
                gdpr.tsx
                privacy.tsx
                terms.tsx
                get-started.tsx
            settings/
                profile.tsx
                security.tsx
                appearance.tsx
            tenant/
                Dashboard.tsx
                Patients.tsx
                Announcements.tsx
                Settings.tsx
            welcome.tsx

routes/
    admin.php                            Super Admin routes (admin domain)
    tenant.php                           Tenant routes (subdomain)
    web.php                              Central routes (localhost)
    settings.php                         User settings (tenant only)
    console.php                          Scheduled tasks

storage/
    logs/laravel.log                     OTP codes appear here in dev
```

---

## Compliance & certification

YaliHealth is designed against the **DHA HMIS Certification Framework**:

- **Data isolation** — schema-per-tenant, enforced at the database layer
- **Immutable audit trail** — every read and write on PHI is logged
- **Encryption** — AES-256 at rest, TLS 1.2+ in transit
- **ODPC registered** — platform operations comply with Kenya's Data Protection Act, 2019
- **ICD-11 standardization** — no free-text diagnoses
- **Consent token discipline** — every claim and SHR action requires a valid consent token
- **HIE integration** — full API support for registries, consent, eligibility, claims, and SHR

The path to certification runs in three phases:

1. **Sandbox** — build and test against DHA's sandbox credentials
2. **UAT** — demonstrate all HIE workflows to the integration team
3. **Production** — receive production credentials, onboard hospitals

### SHA Provider Portal to HMIS migration

Per the Ministry of Health's directive, all 6,427 SHA-contracted facilities must migrate from the SHA Provider Portal to a certified HMIS. See the blog post at `/blog/sha-provider-portal-to-hmis-migration` for the full breakdown.

---

## Scripts

| Command | Purpose |
|---|---|
| `php artisan dev` | Run server + queue + Vite concurrently |
| `php artisan tenants:migrate` | Run tenant migrations across all schemas |
| `php artisan wayfinder:generate` | Regenerate TypeScript route helpers |
| `php artisan api-health:prune --days=30` | Delete stale API health checks |
| `php artisan login-handoff:prune` | Clean expired handoff tokens |
| `npm run build` | Production build |
| `npm run dev` | Vite dev server |

---

## Deployment

### Environment

Production uses:

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourhmis.co.ke
SESSION_DOMAIN=.yourhmis.co.ke
TENANCY_TENANT_SUFFIX=yourhmis.co.ke
TENANCY_ADMIN_DOMAIN=admin.yourhmis.co.ke
```

### Infrastructure

- **Web:** Nginx with wildcard vhost for `*.yourhmis.co.ke` and a specific vhost for `admin.yourhmis.co.ke`
- **TLS:** Let's Encrypt wildcard certificate via DNS-01 challenge
- **PHP:** PHP-FPM 8.3 with OPcache
- **Queue:** Supervisor-managed Horizon workers
- **Schedule:** Cron running `php artisan schedule:run` every minute
- **Database:** Managed PostgreSQL with point-in-time recovery
- **Redis:** Managed Redis for cache, sessions, queues, and HIE token storage

### Deploy sequence

1. `git pull` in the release directory
2. `composer install --no-dev --optimize-autoloader`
3. `npm ci && npm run build`
4. `php artisan migrate --force`
5. `php artisan tenants:migrate`
6. `php artisan config:cache route:cache view:cache`
7. Symlink switch to new release
8. `php artisan horizon:terminate` (workers restart)
9. `php artisan queue:restart`

---

## Known limitations

- **Passkeys rate limiter** must be registered in `AppServiceProvider` — see `RateLimiter::for('passkeys', ...)`.
- **Central domain `/register`** is disabled; use `/get-started`.
- **Tenant self-registration** is disabled; hospital admins create staff accounts.
- **HIE credentials per tenant** are managed via the Super Admin console; tenant-facing management is coming soon.
- **`Tenant::update()` on real columns** silently fails — always use `DB::table('tenants')`.
- **`withCount('tenants')` on Plan** silently fails — use direct `DB::table` queries.

---

## License

Proprietary. All rights reserved.

---

## Contact

Built by Flevian Ochoka (https://portfolio.yaliid.cloud). For platform inquiries, contact the YaliHealth team.