<?php

return [
    'sources' => [
        'ICD-11' => [
            'label' => 'ICD-11',
            'full_label' => 'International Classification of Diseases, 11th Revision',
            'description' => 'WHO standard for diagnoses, conditions, and clinical findings.',
            'icon' => 'book-open',
            'endpoint' => '/api/v1/clinical/concepts?owner=WHO&source=ICD-11',
            'records_estimate' => 55000,
            'color' => '#10B981',
        ],
        'KEML' => [
            'label' => 'KEML',
            'full_label' => 'Kenya Essential Medicines List',
            'description' => 'Standardized drug formulary for prescriptions and dispensing.',
            'icon' => 'pill',
            'endpoint' => '/api/v1/clinical/concepts?owner=MOH&source=KEML',
            'records_estimate' => 950,
            'color' => '#F59E0B',
        ],
        'LOINC' => [
            'label' => 'LOINC',
            'full_label' => 'Logical Observation Identifiers Names and Codes',
            'description' => 'Lab and imaging observation codes.',
            'icon' => 'flask',
            'endpoint' => '/api/v1/clinical/concepts?owner=Regenstrief&source=LOINC',
            'records_estimate' => 92000,
            'color' => '#3B82F6',
        ],
    ],
];