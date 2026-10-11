<?php

return [
    'groups' => [
        'general' => [
            'label' => 'General',
            'description' => 'Platform identity and defaults.',
            'settings' => [
                'platform.name' => [
                    'label' => 'Platform name',
                    'type' => 'text',
                    'default' => 'YaliHealth',
                    'help' => 'Shown in the console, emails, and legal notices.',
                ],
                'platform.support_email' => [
                    'label' => 'Support email',
                    'type' => 'email',
                    'default' => 'support@yalihealth.local',
                ],
                'platform.default_currency' => [
                    'label' => 'Default currency',
                    'type' => 'select',
                    'options' => [
                        'KES' => 'KES — Kenyan Shilling',
                        'USD' => 'USD — US Dollar',
                        'EUR' => 'EUR — Euro',
                        'GBP' => 'GBP — British Pound',
                    ],
                    'default' => 'KES',
                ],
                'platform.timezone' => [
                    'label' => 'Timezone',
                    'type' => 'select',
                    'options' => [
                        'Africa/Nairobi' => 'Africa/Nairobi (EAT)',
                        'Africa/Kampala' => 'Africa/Kampala (EAT)',
                        'Africa/Dar_es_Salaam' => 'Africa/Dar es Salaam (EAT)',
                        'UTC' => 'UTC',
                    ],
                    'default' => 'Africa/Nairobi',
                ],
            ],
        ],
        'tenants' => [
            'label' => 'Tenants',
            'description' => 'Default behavior when onboarding hospitals.',
            'settings' => [
                'tenants.default_trial_days' => [
                    'label' => 'Default trial days',
                    'type' => 'number',
                    'default' => 14,
                    'help' => 'Used if the plan has no trial length.',
                ],
                'tenants.allow_duplicate_names' => [
                    'label' => 'Allow duplicate hospital names',
                    'type' => 'boolean',
                    'default' => true,
                    'help' => 'When enabled, "Yalipital" can exist twice — the second gets yalipital-2 as its subdomain.',
                ],
                'tenants.auto_delete_suspended_days' => [
                    'label' => 'Auto-delete suspended tenants after',
                    'type' => 'number',
                    'default' => 0,
                    'suffix' => 'days',
                    'help' => 'Set to 0 to disable. Otherwise, suspended tenants are permanently removed after this many days.',
                ],
            ],
        ],
        'hie' => [
            'label' => 'HIE Integration',
            'description' => 'Defaults for the national Health Information Exchange.',
            'settings' => [
                'hie.environment' => [
                    'label' => 'HIE environment',
                    'type' => 'select',
                    'options' => [
                        'uat' => 'UAT — testing',
                        'production' => 'Production',
                    ],
                    'default' => 'uat',
                ],
                'hie.base_url' => [
                    'label' => 'HIE API base URL',
                    'type' => 'text',
                    'default' => 'https://ilm-dev.dha.go.ke/uat-middleware',
                    'help' => 'Trailing /api/v1 is added per request.',
                ],
                'hie.timeout_seconds' => [
                    'label' => 'Request timeout',
                    'type' => 'number',
                    'default' => 30,
                    'suffix' => 'seconds',
                ],
                'hie.retry_attempts' => [
                    'label' => 'Retry attempts',
                    'type' => 'number',
                    'default' => 3,
                    'help' => 'Failed HIE calls retry with exponential backoff.',
                ],
            ],
        ],
        'notifications' => [
            'label' => 'Notifications',
            'description' => 'Who gets notified when important events happen.',
            'settings' => [
                'notifications.new_hospital' => [
                    'label' => 'Notify owners when a hospital is created',
                    'type' => 'boolean',
                    'default' => true,
                ],
                'notifications.failed_login' => [
                    'label' => 'Notify owners on failed super admin sign-ins',
                    'type' => 'boolean',
                    'default' => true,
                ],
                'notifications.subscription_expiring' => [
                    'label' => 'Notify when subscriptions are expiring',
                    'type' => 'boolean',
                    'default' => true,
                ],
                'notifications.hie_sync_failures' => [
                    'label' => 'Notify on HIE sync failures',
                    'type' => 'boolean',
                    'default' => false,
                ],
            ],
        ],
        'security' => [
            'label' => 'Security',
            'description' => 'Password policy and session rules.',
            'settings' => [
                'security.min_password_length' => [
                    'label' => 'Minimum password length',
                    'type' => 'number',
                    'default' => 8,
                    'suffix' => 'characters',
                ],
                'security.require_2fa' => [
                    'label' => 'Require 2FA for super admins',
                    'type' => 'boolean',
                    'default' => false,
                    'help' => 'When enabled, all super admins must enable two-factor auth before sign-in.',
                ],
                'security.session_timeout_minutes' => [
                    'label' => 'Session timeout',
                    'type' => 'number',
                    'default' => 120,
                    'suffix' => 'minutes',
                ],
            ],
        ],
        'maintenance' => [
            'label' => 'Maintenance',
            'description' => 'Take the platform offline for scheduled work.',
            'settings' => [
                'maintenance.enabled' => [
                    'label' => 'Enable maintenance mode',
                    'type' => 'boolean',
                    'default' => false,
                    'help' => 'All tenant subdomains display the maintenance message. The super admin console stays reachable.',
                ],
                'maintenance.message' => [
                    'label' => 'Maintenance message',
                    'type' => 'textarea',
                    'default' => 'We are performing scheduled maintenance. Please check back shortly.',
                ],
            ],
        ],
    ],
];