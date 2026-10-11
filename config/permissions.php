<?php

return [
    'groups' => [
        'hospitals' => [
            'label' => 'Hospitals',
            'permissions' => [
                'hospitals.view' => 'View hospitals',
                'hospitals.create' => 'Create hospitals',
                'hospitals.edit' => 'Edit hospital details',
                'hospitals.suspend' => 'Suspend and activate',
                'hospitals.delete' => 'Delete hospitals',
                'hospitals.features' => 'Override features per hospital',
            ],
        ],
        'plans' => [
            'label' => 'Subscription Plans',
            'permissions' => [
                'plans.view' => 'View plans',
                'plans.create' => 'Create plans',
                'plans.edit' => 'Edit plans',
                'plans.delete' => 'Delete plans',
            ],
        ],
        'features' => [
            'label' => 'Feature Flags',
            'permissions' => [
                'features.view' => 'View feature flags',
                'features.toggle' => 'Toggle features on plans',
            ],
        ],
        'announcements' => [
            'label' => 'Announcements',
            'permissions' => [
                'announcements.view' => 'View announcements',
                'announcements.create' => 'Create and edit',
                'announcements.publish' => 'Publish and send',
                'announcements.delete' => 'Delete announcements',
            ],
        ],
        'admins' => [
            'label' => 'Super Admins',
            'permissions' => [
                'admins.view' => 'View super admins',
                'admins.create' => 'Invite super admins',
                'admins.edit' => 'Edit super admins',
                'admins.delete' => 'Remove super admins',
            ],
        ],
        'roles' => [
            'label' => 'Roles & Permissions',
            'permissions' => [
                'roles.view' => 'View roles',
                'roles.create' => 'Create roles',
                'roles.edit' => 'Edit roles',
                'roles.delete' => 'Delete roles',
            ],
        ],
        'audit' => [
            'label' => 'Audit',
            'permissions' => [
                'audit.view' => 'View audit logs',
            ],
        ],
        'settings' => [
            'label' => 'System Settings',
            'permissions' => [
                'settings.view' => 'View settings',
                'settings.edit' => 'Edit settings',
            ],
        ],
    ],
];