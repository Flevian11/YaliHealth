import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, useForm } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    Clock,
    Headphones,
    LoaderCircle,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    Send,
    ShieldCheck,
} from 'lucide-react';
import { FormEventHandler } from 'react';

export default function Contact() {
    const { data, setData, post, processing, errors, reset, recentlySuccessful } =
        useForm({
            name: '',
            email: '',
            hospital: '',
            phone: '',
            subject: 'sales',
            message: '',
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/contact', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <>
            <Head title="Contact us" />

            <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
                {/* Hero */}
                <div className="mx-auto max-w-3xl text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800 backdrop-blur dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <MessageSquare className="h-3 w-3" />
                        We'd love to hear from you
                    </span>
                    <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
                        Get in touch
                    </h1>
                    <p className="mt-4 text-base text-muted-foreground">
                        Questions about pricing, HIE integration, or DHA
                        certification? Our team responds within one business
                        day.
                    </p>
                </div>

                {/* Grid */}
                <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-10">
                    {/* Form */}
                    <Card>
                        <CardContent className="p-6 sm:p-8">
                            {recentlySuccessful && (
                                <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div>
                                        <p className="font-medium">
                                            Message received
                                        </p>
                                        <p className="mt-0.5 text-xs">
                                            We'll be in touch within one
                                            business day.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-5">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Your name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            placeholder="Jane Doe"
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">
                                            Work email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData(
                                                    'email',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="jane@hospital.co.ke"
                                        />
                                        <InputError message={errors.email} />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="hospital">
                                            Hospital / organisation
                                        </Label>
                                        <Input
                                            id="hospital"
                                            value={data.hospital}
                                            onChange={(e) =>
                                                setData(
                                                    'hospital',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Nairobi West Hospital"
                                        />
                                        <InputError
                                            message={errors.hospital}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">
                                            Phone (optional)
                                        </Label>
                                        <Input
                                            id="phone"
                                            value={data.phone}
                                            onChange={(e) =>
                                                setData(
                                                    'phone',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="+254 700 000 000"
                                        />
                                        <InputError message={errors.phone} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="subject">
                                        What can we help with?
                                    </Label>
                                    <select
                                        id="subject"
                                        value={data.subject}
                                        onChange={(e) =>
                                            setData(
                                                'subject',
                                                e.target.value,
                                            )
                                        }
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                                    >
                                        <option value="sales">
                                            Sales & pricing
                                        </option>
                                        <option value="demo">
                                            Schedule a demo
                                        </option>
                                        <option value="hie">
                                            HIE integration questions
                                        </option>
                                        <option value="support">
                                            Technical support
                                        </option>
                                        <option value="partnership">
                                            Partnership
                                        </option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="message">Message</Label>
                                    <textarea
                                        id="message"
                                        value={data.message}
                                        onChange={(e) =>
                                            setData(
                                                'message',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Tell us about your hospital and what you're looking for..."
                                        rows={6}
                                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                                    />
                                    <InputError message={errors.message} />
                                </div>

                                <div className="flex items-center justify-between gap-4 border-t pt-5">
                                    <p className="text-[11px] text-muted-foreground">
                                        By submitting, you agree to our{' '}
                                        <a
                                            href="/privacy"
                                            className="underline hover:text-foreground"
                                        >
                                            Privacy Policy
                                        </a>
                                        .
                                    </p>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        {processing ? (
                                            <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="mr-1.5 h-4 w-4" />
                                        )}
                                        Send message
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Info sidebar */}
                    <div className="space-y-4">
                        <ContactCard
                            icon={Mail}
                            title="Email us"
                            tint="emerald"
                            items={[
                                {
                                    label: 'Sales',
                                    value: 'sales@yalihealth.co.ke',
                                    href: 'mailto:sales@yalihealth.co.ke',
                                },
                                {
                                    label: 'Support',
                                    value: 'support@yalihealth.co.ke',
                                    href: 'mailto:support@yalihealth.co.ke',
                                },
                                {
                                    label: 'Compliance',
                                    value: 'legal@yalihealth.co.ke',
                                    href: 'mailto:legal@yalihealth.co.ke',
                                },
                            ]}
                        />
                        <ContactCard
                            icon={Phone}
                            title="Call us"
                            tint="blue"
                            items={[
                                {
                                    label: 'Sales',
                                    value: '+254 20 000 0000',
                                    href: 'tel:+25420000000',
                                },
                                {
                                    label: 'Support',
                                    value: '+254 700 000 000',
                                    href: 'tel:+254700000000',
                                },
                            ]}
                        />
                        <ContactCard
                            icon={MapPin}
                            title="Visit us"
                            tint="amber"
                            items={[
                                {
                                    label: 'Office',
                                    value: 'Westlands, Nairobi, Kenya',
                                },
                            ]}
                        />

                        <div className="rounded-2xl border bg-emerald-50/50 p-5 dark:bg-emerald-950/20">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                                    Response time
                                </span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                Sales and general enquiries are answered
                                within one business day. Support tickets are
                                triaged within 2 hours during Kenyan business
                                hours.
                            </p>
                        </div>

                        <div className="flex items-start gap-3 rounded-2xl border bg-card p-5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold">
                                    Security disclosure
                                </p>
                                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                                    Found a vulnerability? Report it to{' '}
                                    <a
                                        href="mailto:security@yalihealth.co.ke"
                                        className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                                    >
                                        security@yalihealth.co.ke
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function ContactCard({
    icon: Icon,
    title,
    tint,
    items,
}: {
    icon: any;
    title: string;
    tint: 'emerald' | 'blue' | 'amber';
    items: { label: string; value: string; href?: string }[];
}) {
    const tints: Record<string, string> = {
        emerald:
            'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    };

    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-center gap-2.5">
                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${tints[tint]}`}
                    >
                        <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold">{title}</p>
                </div>
                <div className="mt-3 space-y-2.5">
                    {items.map((item) => (
                        <div key={item.label}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {item.label}
                            </p>
                            {item.href ? (
                                <a
                                    href={item.href}
                                    className="text-sm font-medium text-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                                >
                                    {item.value}
                                </a>
                            ) : (
                                <p className="text-sm font-medium text-foreground">
                                    {item.value}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}