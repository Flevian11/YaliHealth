<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Open positions
    |--------------------------------------------------------------------------
    |
    | Add a position by appending to this array. The careers page reads from
    | here. When empty, the page shows a friendly "no openings" state.
    |
    | Structure per position:
    |   slug             — URL-friendly unique id
    |   title            — job title
    |   department       — Engineering, Design, Sales, etc.
    |   location         — "Nairobi (Hybrid)" etc.
    |   type             — Full-time, Contract, Part-time, Internship
    |   experience       — e.g. "3+ years"
    |   salary_range     — optional string
    |   description      — 1-2 paragraph summary
    |   responsibilities — array of strings
    |   requirements     — array of strings
    |   nice_to_have     — array of strings (optional)
    |   posted_at        — ISO date
    |   is_open          — bool
    |
    */

    'positions' => [
        // Example:
        // [
        //     'slug' => 'senior-laravel-engineer',
        //     'title' => 'Senior Laravel Engineer',
        //     'department' => 'Engineering',
        //     'location' => 'Nairobi (Hybrid)',
        //     'type' => 'Full-time',
        //     'experience' => '5+ years',
        //     'salary_range' => 'KES 300,000 – 450,000',
        //     'description' => '...',
        //     'responsibilities' => ['...'],
        //     'requirements' => ['...'],
        //     'nice_to_have' => ['...'],
        //     'posted_at' => '2026-10-01',
        //     'is_open' => true,
        // ],
    ],

    'perks' => [
        [
            'icon' => 'heart',
            'title' => 'Comprehensive health cover',
            'desc' => 'You and your immediate family, from day one.',
        ],
        [
            'icon' => 'laptop',
            'title' => 'Hybrid by default',
            'desc' => 'Work from home two days a week, in-office three.',
        ],
        [
            'icon' => 'graduation',
            'title' => 'Learning budget',
            'desc' => 'KES 100,000 per year for courses, books, and conferences.',
        ],
        [
            'icon' => 'clock',
            'title' => 'Flexible hours',
            'desc' => 'Core hours 10am–3pm. The rest is yours to shape.',
        ],
        [
            'icon' => 'users',
            'title' => 'Team offsites',
            'desc' => 'Two team retreats a year, fully covered.',
        ],
        [
            'icon' => 'shield',
            'title' => 'Real impact',
            'desc' => 'Every feature ships to real hospitals on the HIE.',
        ],
    ],

    'contact_email' => 'careers@yalihealth.co.ke',
];