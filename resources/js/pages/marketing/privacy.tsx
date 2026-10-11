import { LegalShell, LegalSection } from '@/components/marketing/legal-shell';
import { Head } from '@inertiajs/react';

const sections: LegalSection[] = [
    {
        id: 'overview',
        title: 'Overview',
        body: (
            <>
                <p>
                    This Privacy Policy explains how YaliHealth collects,
                    uses, stores, and protects personal and health data when
                    you use our platform.
                </p>
                <p>
                    We are registered with the Office of the Data Protection
                    Commissioner (ODPC) as a Data Controller and Data
                    Processor under the Kenya Data Protection Act, 2019.
                </p>
            </>
        ),
    },
    {
        id: 'data-we-collect',
        title: 'Data we collect',
        body: (
            <>
                <p>We collect the following categories of data:</p>
                <ul>
                    <li>
                        <strong>Account data</strong> — name, email, phone,
                        role, and credentials of hospital staff
                    </li>
                    <li>
                        <strong>Patient data</strong> — demographic, clinical,
                        and billing records entered by hospital staff
                    </li>
                    <li>
                        <strong>HIE data</strong> — patient identifiers,
                        consent tokens, claims, and records exchanged with the
                        national HIE
                    </li>
                    <li>
                        <strong>Technical data</strong> — IP addresses, user
                        agents, session logs, and audit trails
                    </li>
                    <li>
                        <strong>Billing data</strong> — subscription
                        information and payment records
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: 'how-we-use',
        title: 'How we use your data',
        body: (
            <>
                <p>We process data strictly to:</p>
                <ul>
                    <li>Provide, maintain, and improve the Service</li>
                    <li>
                        Enable HIE integration you have explicitly authorised
                    </li>
                    <li>Ensure platform security and detect fraud</li>
                    <li>
                        Comply with legal obligations under the Digital Health
                        Act and Data Protection Act
                    </li>
                    <li>
                        Send service notices and administrative communications
                    </li>
                </ul>
                <p>
                    We never sell or rent personal or health data to third
                    parties.
                </p>
            </>
        ),
    },
    {
        id: 'legal-basis',
        title: 'Legal basis for processing',
        body: (
            <>
                <p>Our legal bases for processing personal data are:</p>
                <ul>
                    <li>
                        <strong>Contract</strong> — to deliver the Service you
                        subscribed to
                    </li>
                    <li>
                        <strong>Legal obligation</strong> — to comply with
                        health-sector and tax regulations
                    </li>
                    <li>
                        <strong>Vital interests</strong> — to protect patient
                        safety in emergencies
                    </li>
                    <li>
                        <strong>Consent</strong> — where required, such as HIE
                        data sharing
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: 'sharing',
        title: 'Data sharing',
        body: (
            <>
                <p>We share data only with:</p>
                <ul>
                    <li>
                        The <strong>Health Information Exchange (HIE)</strong>{' '}
                        when you authorise a specific action
                    </li>
                    <li>Your hospital's staff, according to roles you define</li>
                    <li>
                        Subprocessors that host the platform (PostgreSQL,
                        Redis, email delivery)
                    </li>
                    <li>Regulators when legally required</li>
                </ul>
                <p>
                    All subprocessors are bound by data processing agreements
                    and operate under Kenyan data residency where required.
                </p>
            </>
        ),
    },
    {
        id: 'retention',
        title: 'Retention',
        body: (
            <>
                <p>
                    Patient records are retained for the period required by
                    the Kenya Medical Practitioners and Dentists Council and
                    the Digital Health Act — typically 7 years from last
                    encounter, or longer for minors.
                </p>
                <p>
                    Audit logs are retained for 7 years. Account data is
                    retained for the duration of the subscription plus 30
                    days.
                </p>
            </>
        ),
    },
    {
        id: 'rights',
        title: 'Your rights',
        body: (
            <>
                <p>Under the Data Protection Act, you have the right to:</p>
                <ul>
                    <li>Access personal data we hold about you</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion where legally permitted</li>
                    <li>Object to or restrict processing</li>
                    <li>
                        Data portability in a structured, machine-readable
                        format
                    </li>
                    <li>Lodge a complaint with the ODPC</li>
                </ul>
                <p>
                    Requests can be submitted through your tenant
                    administrator or by emailing our Data Protection Officer.
                </p>
            </>
        ),
    },
    {
        id: 'security',
        title: 'Security',
        body: (
            <>
                <p>We protect data with:</p>
                <ul>
                    <li>AES-256 encryption for data at rest</li>
                    <li>TLS 1.2+ for all data in transit</li>
                    <li>Per-tenant database schema isolation</li>
                    <li>Immutable audit logging of every PHI access</li>
                    <li>
                        Role-based access control with two-factor
                        authentication
                    </li>
                    <li>
                        Regular penetration testing and vulnerability scanning
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: 'breach',
        title: 'Data breach notification',
        body: (
            <>
                <p>In the event of a personal data breach, we notify:</p>
                <ul>
                    <li>The ODPC within 72 hours of becoming aware</li>
                    <li>Affected tenants without undue delay</li>
                    <li>
                        Affected data subjects where the breach poses a high
                        risk to their rights
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: 'contact-dpo',
        title: 'Contact',
        body: (
            <>
                <p>
                    For privacy questions or to exercise your rights, contact
                    our Data Protection Officer at{' '}
                    <a href="mailto:dpo@yalihealth.co.ke">
                        dpo@yalihealth.co.ke
                    </a>
                    .
                </p>
            </>
        ),
    },
];

export default function Privacy() {
    return (
        <>
            <Head title="Privacy Policy" />
            <LegalShell
                title="Privacy Policy"
                updated="1 October 2026"
                intro="Your privacy matters. This policy describes exactly what data YaliHealth collects, how it is used, who can access it, and how we protect it under Kenyan law."
                sections={sections}
            />
        </>
    );
}