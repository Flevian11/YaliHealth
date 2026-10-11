import { LegalShell, LegalSection } from '@/components/marketing/legal-shell';
import { Head } from '@inertiajs/react';

const sections: LegalSection[] = [
    {
        id: 'scope',
        title: 'Scope and framework',
        body: (
            <>
                <p>
                    This page describes how YaliHealth complies with the
                    Kenya Data Protection Act, 2019 and, where applicable, the
                    EU General Data Protection Regulation (GDPR) for
                    international users.
                </p>
                <p>
                    We act as a <strong>Data Controller</strong> for
                    platform-level data (accounts, billing, technical logs)
                    and as a <strong>Data Processor</strong> for patient data
                    entered by hospitals using the Service.
                </p>
            </>
        ),
    },
    {
        id: 'principles',
        title: 'Data protection principles',
        body: (
            <>
                <p>We adhere to the following principles:</p>
                <ul>
                    <li><strong>Lawfulness, fairness, transparency</strong> — we process data only on valid legal bases</li>
                    <li><strong>Purpose limitation</strong> — we collect data for specific, explicit purposes</li>
                    <li><strong>Data minimisation</strong> — we collect only what is necessary</li>
                    <li><strong>Accuracy</strong> — we maintain data accuracy and correct errors promptly</li>
                    <li><strong>Storage limitation</strong> — we retain data only as long as required</li>
                    <li><strong>Integrity and confidentiality</strong> — we enforce encryption and access controls</li>
                    <li><strong>Accountability</strong> — we document our compliance and can demonstrate it</li>
                </ul>
            </>
        ),
    },
    {
        id: 'dpa',
        title: 'Data Processing Agreements',
        body: (
            <>
                <p>
                    Every hospital using YaliHealth enters into a Data
                    Processing Agreement (DPA) with us as part of onboarding.
                    The DPA sets out:
                </p>
                <ul>
                    <li>Categories of personal data processed</li>
                    <li>Duration and purpose of processing</li>
                    <li>Technical and organisational security measures</li>
                    <li>Subprocessor list and change notification</li>
                    <li>Data subject rights and assistance obligations</li>
                    <li>Breach notification procedures</li>
                    <li>Return or deletion of data upon termination</li>
                </ul>
            </>
        ),
    },
    {
        id: 'subprocessors',
        title: 'Subprocessors',
        body: (
            <>
                <p>We use the following categories of subprocessors:</p>
                <ul>
                    <li><strong>Cloud infrastructure</strong> — for hosting the platform within Kenyan or Africa-region data centres</li>
                    <li><strong>Email delivery</strong> — for transactional and administrative emails</li>
                    <li><strong>Monitoring</strong> — for uptime and error tracking with data minimisation</li>
                </ul>
                <p>
                    A complete, up-to-date list is available on request. We
                    notify customers 30 days before adding a subprocessor that
                    handles personal data.
                </p>
            </>
        ),
    },
    {
        id: 'international',
        title: 'International transfers',
        body: (
            <>
                <p>
                    Personal data is stored primarily within Kenya. Any
                    international transfer is conducted only under:
                </p>
                <ul>
                    <li>Adequacy decisions by the ODPC</li>
                    <li>Standard contractual clauses</li>
                    <li>Explicit consent for specific transfers</li>
                </ul>
            </>
        ),
    },
    {
        id: 'rights-gdpr',
        title: 'Your rights',
        body: (
            <>
                <p>
                    Whether you are in Kenya or the EU/EEA, you have the
                    following rights, and we respond to requests within 30
                    days:
                </p>
                <ul>
                    <li>Right of access — obtain a copy of your data</li>
                    <li>Right to rectification — correct inaccurate data</li>
                    <li>Right to erasure ("right to be forgotten") — where legally permissible</li>
                    <li>Right to restriction of processing</li>
                    <li>Right to data portability — receive data in a structured format</li>
                    <li>Right to object — for processing based on legitimate interests</li>
                    <li>Rights related to automated decision-making</li>
                </ul>
                <p>
                    Submit requests through your tenant administrator or by
                    emailing our Data Protection Officer.
                </p>
            </>
        ),
    },
    {
        id: 'automated',
        title: 'Automated decision-making',
        body: (
            <>
                <p>
                    YaliHealth does not use automated decision-making or
                    profiling that produces legal or similarly significant
                    effects on individuals. All clinical and billing decisions
                    remain under human control.
                </p>
            </>
        ),
    },
    {
        id: 'security-measures',
        title: 'Technical and organisational measures',
        body: (
            <>
                <p>Key security measures include:</p>
                <ul>
                    <li>Encryption of data at rest using AES-256</li>
                    <li>Encryption of data in transit using TLS 1.2+</li>
                    <li>Physical isolation of each hospital's data in dedicated database schemas</li>
                    <li>Two-factor authentication for all administrative accounts</li>
                    <li>Immutable, tamper-proof audit logs</li>
                    <li>Annual penetration testing and continuous vulnerability scanning</li>
                    <li>Employee confidentiality agreements and background checks</li>
                    <li>Formal incident response plan with 72-hour breach notification</li>
                </ul>
            </>
        ),
    },
    {
        id: 'cooperation',
        title: 'Cooperation with authorities',
        body: (
            <>
                <p>
                    We cooperate with the Office of the Data Protection
                    Commissioner, the Digital Health Agency, and other
                    regulators as required by law. Data subjects and customers
                    will be notified of any lawful request for access to their
                    data unless prohibited by a court order.
                </p>
            </>
        ),
    },
    {
        id: 'contact-dpo',
        title: 'Contact the DPO',
        body: (
            <>
                <p>
                    Our Data Protection Officer can be reached at{' '}
                    <a
                        href="mailto:dpo@yalihealth.co.ke"
                        className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                        dpo@yalihealth.co.ke
                    </a>
                    .
                </p>
                <p>
                    You also have the right to lodge a complaint with the
                    Office of the Data Protection Commissioner at{' '}
                    <a
                        href="https://www.odpc.go.ke"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                        odpc.go.ke
                    </a>
                    .
                </p>
            </>
        ),
    },
];

export default function Gdpr() {
    return (
        <>
            <Head title="Data Protection & GDPR" />
            <LegalShell
                title="Data Protection & GDPR"
                updated="1 October 2026"
                intro="YaliHealth is built for compliance with the Kenya Data Protection Act, 2019 and international frameworks such as GDPR. Here is exactly how we protect the data entrusted to us."
                sections={sections}
            />
        </>
    );
}