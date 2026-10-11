import { LegalShell, LegalSection } from '@/components/marketing/legal-shell';
import { Head } from '@inertiajs/react';

const sections: LegalSection[] = [
    {
        id: 'acceptance',
        title: 'Acceptance of terms',
        body: (
            <>
                <p>
                    By accessing or using YaliHealth ("the Service"), you agree
                    to be bound by these Terms of Service ("Terms"). If you are
                    entering into these Terms on behalf of a hospital,
                    clinic, or other healthcare organisation, you represent
                    that you have authority to bind that entity.
                </p>
                <p>
                    If you do not agree to these Terms, you must not access or
                    use the Service.
                </p>
            </>
        ),
    },
    {
        id: 'service',
        title: 'The service',
        body: (
            <>
                <p>
                    YaliHealth is a multi-tenant Hospital Management
                    Information System (HMIS) that provides electronic medical
                    records, billing, claims processing, and integration with
                    the Kenyan Health Information Exchange (HIE).
                </p>
                <p>
                    We provide the Service on a subscription basis. The scope
                    of features available to your organisation depends on the
                    plan you select. All plans include full platform access as
                    described on our pricing page.
                </p>
            </>
        ),
    },
    {
        id: 'accounts',
        title: 'Accounts and access',
        body: (
            <>
                <p>
                    Each hospital ("tenant") receives its own dedicated
                    subdomain and isolated database schema. You are responsible
                    for:
                </p>
                <ul>
                    <li>Maintaining the confidentiality of administrator credentials</li>
                    <li>All activity that occurs under your tenant</li>
                    <li>Promptly notifying us of any unauthorised access</li>
                    <li>Ensuring staff accounts are deactivated when employment ends</li>
                </ul>
            </>
        ),
    },
    {
        id: 'acceptable-use',
        title: 'Acceptable use',
        body: (
            <>
                <p>You agree not to:</p>
                <ul>
                    <li>Use the Service to violate any law, including the Kenya Data Protection Act, 2019</li>
                    <li>Attempt to access data belonging to another tenant</li>
                    <li>Introduce malicious code or attempt to compromise the platform</li>
                    <li>Resell or sublicense access without written permission</li>
                    <li>Use the Service to submit fraudulent claims to SHA or any payer</li>
                </ul>
            </>
        ),
    },
    {
        id: 'data',
        title: 'Your data and ownership',
        body: (
            <>
                <p>
                    You retain full ownership of all patient data, clinical
                    records, and business information you enter into the
                    Service.
                </p>
                <p>
                    You grant us a limited licence to process your data solely
                    for the purpose of providing the Service, meeting legal
                    obligations, and complying with HIE integration
                    requirements you have authorised.
                </p>
                <p>
                    You may export your data at any time in FHIR and CSV
                    formats. Upon termination, data is retained for 30 days,
                    then permanently deleted from production and backups.
                </p>
            </>
        ),
    },
    {
        id: 'compliance',
        title: 'Regulatory compliance',
        body: (
            <>
                <p>
                    You are responsible for ensuring that your use of the
                    Service complies with all applicable healthcare
                    regulations, including:
                </p>
                <ul>
                    <li>Digital Health Act and its subsidiary regulations</li>
                    <li>Kenya Data Protection Act, 2019</li>
                    <li>SHA claims submission requirements</li>
                    <li>Medical Practitioners and Dentists Council rules</li>
                </ul>
                <p>
                    We provide the technical infrastructure to meet these
                    obligations but cannot assume your legal responsibility as
                    a healthcare provider.
                </p>
            </>
        ),
    },
    {
        id: 'billing',
        title: 'Billing and payment',
        body: (
            <>
                <p>
                    Subscription fees are billed in advance based on the
                    billing cycle selected. A one-time setup fee applies on
                    first activation. Trials convert to paid subscriptions
                    automatically unless cancelled before the trial ends.
                </p>
                <p>
                    Fees are non-refundable except where required by law.
                    Overdue accounts may be suspended after 14 days' notice.
                </p>
            </>
        ),
    },
    {
        id: 'availability',
        title: 'Service availability',
        body: (
            <>
                <p>
                    We target 99.9% monthly uptime. Scheduled maintenance is
                    performed during off-peak hours and announced in advance.
                    Emergency maintenance may occur without notice.
                </p>
                <p>
                    We are not liable for downtime caused by third-party
                    systems, including the HIE, or events outside our
                    reasonable control.
                </p>
            </>
        ),
    },
    {
        id: 'termination',
        title: 'Termination',
        body: (
            <>
                <p>
                    Either party may terminate with 30 days' written notice.
                    We may suspend or terminate immediately for material
                    breach, non-payment, or illegal activity.
                </p>
                <p>
                    On termination, you retain the right to export your data
                    for 30 days. After that period, all data is permanently
                    deleted.
                </p>
            </>
        ),
    },
    {
        id: 'liability',
        title: 'Limitation of liability',
        body: (
            <>
                <p>
                    To the maximum extent permitted by law, our total liability
                    arising from or relating to the Service is limited to the
                    fees you paid in the 12 months preceding the claim.
                </p>
                <p>
                    We are not liable for indirect, incidental, or
                    consequential damages, including lost profits or clinical
                    outcomes resulting from use of the Service.
                </p>
            </>
        ),
    },
    {
        id: 'changes',
        title: 'Changes to these terms',
        body: (
            <>
                <p>
                    We may update these Terms from time to time. Material
                    changes are communicated at least 30 days in advance via
                    email to the account administrator. Continued use after
                    the effective date constitutes acceptance.
                </p>
            </>
        ),
    },
    {
        id: 'law',
        title: 'Governing law',
        body: (
            <>
                <p>
                    These Terms are governed by the laws of Kenya. Disputes
                    are subject to the exclusive jurisdiction of the courts of
                    Nairobi.
                </p>
            </>
        ),
    },
];

export default function Terms() {
    return (
        <>
            <Head title="Terms of Service" />
            <LegalShell
                title="Terms of Service"
                updated="1 October 2026"
                intro="These terms govern your access to and use of the YaliHealth platform. Please read them carefully before creating an account or using the Service."
                sections={sections}
            />
        </>
    );
}