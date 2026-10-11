<?php

namespace App\Services;

use App\Models\TerminologyConcept;
use App\Models\TerminologyMapping;
use App\Models\TerminologySyncJob;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class TerminologySyncService
{
    public function sync(string $source, ?int $triggeredBy = null, string $trigger = 'manual'): TerminologySyncJob
    {
        if (! isset(config('terminology.sources', [])[$source])) {
            throw new \InvalidArgumentException("Unknown source: {$source}");
        }

        $job = TerminologySyncJob::create([
            'source' => $source,
            'status' => 'running',
            'triggered_by' => $triggeredBy,
            'trigger_source' => $trigger,
            'started_at' => now(),
        ]);

        $startedAt = microtime(true);
        $created = 0;
        $updated = 0;
        $mappings = 0;

        try {
            $data = $this->fetchConcepts($source);
            $concepts = $data['concepts'] ?? [];
            $mapRows = $data['mappings'] ?? [];

            DB::transaction(function () use ($source, $concepts, $mapRows, &$created, &$updated, &$mappings) {
                foreach ($concepts as $row) {
                    $existing = TerminologyConcept::forSource($source)
                        ->where('code', $row['code'])
                        ->first();

                    if ($existing) {
                        $existing->update($row + ['synced_at' => now()]);
                        $updated++;
                    } else {
                        TerminologyConcept::create($row + [
                            'source' => $source,
                            'synced_at' => now(),
                        ]);
                        $created++;
                    }
                }

                // Replace mappings for this source
                TerminologyMapping::where('source', $source)->delete();

                foreach ($mapRows as $row) {
                    TerminologyMapping::create($row + [
                        'source' => $source,
                        'synced_at' => now(),
                    ]);
                    $mappings++;
                }
            });

            $duration = (int) round((microtime(true) - $startedAt) * 1000);

            $job->update([
                'status' => 'completed',
                'concepts_fetched' => count($concepts),
                'concepts_created' => $created,
                'concepts_updated' => $updated,
                'mappings_created' => $mappings,
                'duration_ms' => $duration,
                'completed_at' => now(),
            ]);
        } catch (Throwable $e) {
            $duration = (int) round((microtime(true) - $startedAt) * 1000);
            $job->update([
                'status' => 'failed',
                'duration_ms' => $duration,
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);
            Log::error('terminology.sync.failed', ['source' => $source, 'error' => $e->getMessage()]);
        }

        return $job->fresh();
    }

    /**
     * Fetch concepts + mappings from the source.
     * When HIE credentials are available, replace each block with HTTP calls.
     * Record shape must remain: code, title, definition, chapter_*, block_*, parent_code, is_leaf, synonyms, inclusions, exclusions, indexing_references, raw_data.
     */
    protected function fetchConcepts(string $source): array
    {
        return match ($source) {
            'ICD-11' => $this->seedIcd11(),
            'KEML' => $this->seedKeml(),
            'LOINC' => $this->seedLoinc(),
            default => ['concepts' => [], 'mappings' => []],
        };
    }

    private function seedIcd11(): array
    {
        $rows = [
            // Chapter 01 — Infectious
            ['1A00.Z', 'Cholera, unspecified', 'Cholera due to Vibrio cholerae', '01', 'Certain infectious or parasitic diseases', '1A00', 'Cholera'],
            ['1A62.Z', 'HIV disease, unspecified', 'Human immunodeficiency virus disease without mention of associated conditions', '01', 'Certain infectious or parasitic diseases', '1A62', 'HIV disease'],
            ['1B10.Z', 'Tuberculosis of respiratory system', 'Tuberculosis of the respiratory system, unspecified', '01', 'Certain infectious or parasitic diseases', '1B10', 'Tuberculosis'],
            ['1F40.Z', 'Malaria, unspecified', 'Plasmodium infection without specification', '01', 'Certain infectious or parasitic diseases', '1F40', 'Malaria'],
            ['1F40.0', 'Plasmodium falciparum malaria', 'Malaria due to P. falciparum', '01', 'Certain infectious or parasitic diseases', '1F40', 'Malaria'],
            ['1C62.0', 'HIV disease — clinical stage 1', 'Asymptomatic HIV infection', '01', 'Certain infectious or parasitic diseases', '1C62', 'HIV disease'],

            // Chapter 02 — Neoplasms
            ['2C20.Z', 'Malignant neoplasm of breast, unspecified', 'Breast carcinoma', '02', 'Neoplasms', '2C20', 'Breast cancer'],
            ['2C25.Z', 'Malignant neoplasm of lung, unspecified', 'Bronchogenic carcinoma', '02', 'Neoplasms', '2C25', 'Lung cancer'],

            // Chapter 03 — Blood
            ['3A00.Z', 'Iron deficiency anaemia, unspecified', 'Anaemia due to iron deficiency', '03', 'Diseases of the blood or blood-forming organs', '3A00', 'Iron deficiency anaemia'],
            ['3A51.Z', 'Sickle cell anaemia', 'Hereditary haemoglobinopathy', '03', 'Diseases of the blood or blood-forming organs', '3A51', 'Sickle cell disorders'],

            // Chapter 05 — Endocrine
            ['5A11.Z', 'Type 1 diabetes mellitus', 'Insulin-dependent diabetes', '05', 'Endocrine, nutritional or metabolic diseases', '5A11', 'Type 1 diabetes'],
            ['5A11.0', 'Type 1 diabetes mellitus with ketoacidosis', 'Type 1 diabetes with complication', '05', 'Endocrine, nutritional or metabolic diseases', '5A11', 'Type 1 diabetes'],
            ['5A12.Z', 'Type 2 diabetes mellitus', 'Non-insulin-dependent diabetes', '05', 'Endocrine, nutritional or metabolic diseases', '5A12', 'Type 2 diabetes'],
            ['5B55.Z', 'Hypothyroidism, unspecified', 'Underactive thyroid', '05', 'Endocrine, nutritional or metabolic diseases', '5B55', 'Hypothyroidism'],
            ['5B81.Z', 'Obesity, unspecified', 'Excess body fat accumulation', '05', 'Endocrine, nutritional or metabolic diseases', '5B81', 'Obesity'],

            // Chapter 06 — Mental
            ['6A70.Z', 'Depressive episode, unspecified', 'Single or recurrent depression', '06', 'Mental, behavioural or neurodevelopmental disorders', '6A70', 'Depressive disorders'],
            ['6A80.Z', 'Anxiety disorder, unspecified', 'Anxious affect disorder', '06', 'Mental, behavioural or neurodevelopmental disorders', '6A80', 'Anxiety disorders'],

            // Chapter 08 — Nervous
            ['8A80.Z', 'Epilepsy, unspecified', 'Recurrent unprovoked seizures', '08', 'Diseases of the nervous system', '8A80', 'Epilepsy'],
            ['8B20.Z', 'Migraine, unspecified', 'Recurrent headache disorder', '08', 'Diseases of the nervous system', '8B20', 'Migraine'],

            // Chapter 11 — Circulatory
            ['BA00.Z', 'Essential hypertension, unspecified', 'Primary hypertension', '11', 'Diseases of the circulatory system', 'BA00', 'Essential hypertension'],
            ['BA01.Z', 'Heart failure, unspecified', 'Cardiac insufficiency', '11', 'Diseases of the circulatory system', 'BA01', 'Heart failure'],
            ['BA41.Z', 'Acute myocardial infarction, unspecified', 'Heart attack', '11', 'Diseases of the circulatory system', 'BA41', 'Acute myocardial infarction'],
            ['BA80.Z', 'Angina pectoris, unspecified', 'Chest pain from coronary disease', '11', 'Diseases of the circulatory system', 'BA80', 'Angina'],

            // Chapter 12 — Respiratory
            ['CA22.Z', 'Chronic obstructive pulmonary disease, unspecified', 'COPD', '12', 'Diseases of the respiratory system', 'CA22', 'COPD'],
            ['CA23.Z', 'Asthma, unspecified', 'Reversible airway obstruction', '12', 'Diseases of the respiratory system', 'CA23', 'Asthma'],
            ['CA40.Z', 'Pneumonia, unspecified organism', 'Lung parenchyma infection', '12', 'Diseases of the respiratory system', 'CA40', 'Pneumonia'],
            ['CA40.0', 'Bronchopneumonia', 'Pneumonia with bronchial involvement', '12', 'Diseases of the respiratory system', 'CA40', 'Pneumonia'],

            // Chapter 13 — Digestive
            ['DA42.Z', 'Gastritis, unspecified', 'Stomach lining inflammation', '13', 'Diseases of the digestive system', 'DA42', 'Gastritis'],
            ['DA90.Z', 'Peptic ulcer, unspecified', 'Ulcer of stomach or duodenum', '13', 'Diseases of the digestive system', 'DA90', 'Peptic ulcer'],
            ['DB91.Z', 'Gastroenteritis, unspecified', 'Intestinal infection', '13', 'Diseases of the digestive system', 'DB91', 'Gastroenteritis'],

            // Chapter 15 — Musculoskeletal
            ['FA20.Z', 'Osteoarthritis, unspecified', 'Degenerative joint disease', '15', 'Diseases of the musculoskeletal system', 'FA20', 'Osteoarthritis'],
            ['FA25.Z', 'Rheumatoid arthritis, unspecified', 'Autoimmune joint disease', '15', 'Diseases of the musculoskeletal system', 'FA25', 'Rheumatoid arthritis'],
            ['FB40.Z', 'Osteoporosis, unspecified', 'Reduced bone density', '15', 'Diseases of the musculoskeletal system', 'FB40', 'Osteoporosis'],

            // Chapter 16 — Genitourinary
            ['GB40.Z', 'Urinary tract infection, unspecified', 'UTI', '16', 'Diseases of the genitourinary system', 'GB40', 'Urinary tract infection'],
            ['GB60.Z', 'Chronic kidney disease, unspecified', 'CKD', '16', 'Diseases of the genitourinary system', 'GB60', 'Chronic kidney disease'],

            // Chapter 18 — Pregnancy
            ['JA00.Z', 'Normal pregnancy', 'Uncomplicated pregnancy', '18', 'Pregnancy, childbirth or the puerperium', 'JA00', 'Normal pregnancy'],
            ['JA40.Z', 'Puerperal sepsis', 'Postpartum infection', '18', 'Pregnancy, childbirth or the puerperium', 'JA40', 'Puerperal sepsis'],
            ['JB00.Z', 'Spontaneous labour, unspecified', 'Onset of labour without intervention', '18', 'Pregnancy, childbirth or the puerperium', 'JB00', 'Spontaneous labour'],

            // Chapter 21 — Symptoms
            ['MB40.Z', 'Pain, unspecified', 'Generalized pain', '21', 'Symptoms, signs or clinical findings', 'MB40', 'Pain'],
            ['MB45.Z', 'Low back pain', 'Lumbar spine pain', '21', 'Symptoms, signs or clinical findings', 'MB45', 'Low back pain'],
            ['MD10.Z', 'Fever, unspecified', 'Elevated body temperature', '21', 'Symptoms, signs or clinical findings', 'MD10', 'Fever'],
            ['MD80.Z', 'Cough, unspecified', 'Cough without specification', '21', 'Symptoms, signs or clinical findings', 'MD80', 'Cough'],
            ['ME01.Z', 'Headache, unspecified', 'Cephalalgia', '21', 'Symptoms, signs or clinical findings', 'ME01', 'Headache'],

            // Chapter 22 — Injury
            ['LD50.Z', 'Fracture of femur, unspecified', 'Thigh bone fracture', '22', 'Injury, poisoning or certain other consequences of external causes', 'LD50', 'Femur fracture'],
            ['NA00.Z', 'Superficial injury, unspecified', 'Minor wound', '22', 'Injury, poisoning or certain other consequences of external causes', 'NA00', 'Superficial injuries'],
        ];

        $concepts = array_map(fn ($r) => [
            'code' => $r[0],
            'title' => $r[1],
            'definition' => $r[2],
            'chapter_code' => $r[3],
            'chapter_title' => $r[4],
            'block_code' => $r[5],
            'block_title' => $r[6],
            'parent_code' => null,
            'is_leaf' => true,
            'synonyms' => $this->synonymsFor($r[0]),
            'inclusions' => [],
            'exclusions' => [],
            'indexing_references' => [],
            'raw_data' => ['system' => 'ICD-11', 'revision' => '2024'],
        ], $rows);

        // Build mappings: has-parent for codes with dots, has-child the reverse
        $mappings = [];
        foreach ($rows as $r) {
            $parts = explode('.', $r[0]);
            if (count($parts) === 2) {
                $parentCode = $parts[0] . '.Z';
                $mappings[] = [
                    'from_code' => $r[0],
                    'to_code' => $parentCode,
                    'to_source' => 'ICD-11',
                    'to_title' => collect($rows)->firstWhere(0, $parentCode)[1] ?? null,
                    'map_type' => 'has-parent',
                ];
                $mappings[] = [
                    'from_code' => $parentCode,
                    'to_code' => $r[0],
                    'to_source' => 'ICD-11',
                    'to_title' => $r[1],
                    'map_type' => 'has-child',
                ];
            }
        }

        return ['concepts' => $concepts, 'mappings' => $mappings];
    }

    private function synonymsFor(string $code): array
    {
        return match ($code) {
            '1F40.Z' => ['Malaria', 'Malarial fever'],
            '1F40.0' => ['Falciparum malaria', 'Malignant tertian malaria'],
            '5A11.Z' => ['T1DM', 'Juvenile diabetes', 'IDDM'],
            '5A12.Z' => ['T2DM', 'Adult-onset diabetes', 'NIDDM'],
            'BA00.Z' => ['High blood pressure', 'HTN'],
            'BA01.Z' => ['Congestive heart failure', 'CHF'],
            'BA41.Z' => ['Heart attack', 'MI'],
            'CA23.Z' => ['Bronchial asthma'],
            'CA40.Z' => ['Chest infection'],
            'GB60.Z' => ['CKD', 'Renal failure'],
            'MD10.Z' => ['Pyrexia', 'Febrile illness'],
            default => [],
        };
    }

    private function seedKeml(): array
    {
        $rows = [
            ['GE12047', 'Paracetamol 500mg tablet', 'Analgesics'],
            ['GE12048', 'Ibuprofen 400mg tablet', 'NSAIDs'],
            ['GE12049', 'Amoxicillin 500mg capsule', 'Antibiotics'],
            ['GE12050', 'Artemether/Lumefantrine 20/120mg', 'Antimalarials'],
            ['GE12051', 'Metformin 500mg tablet', 'Antidiabetics'],
            ['GE12052', 'Amlodipine 5mg tablet', 'Antihypertensives'],
            ['GE12053', 'Omeprazole 20mg capsule', 'Proton pump inhibitors'],
            ['GE12054', 'Ceftriaxone 1g injection', 'Antibiotics'],
            ['GE12055', 'Salbutamol inhaler 100mcg', 'Bronchodilators'],
            ['GE12056', 'Ferrous sulphate 200mg tablet', 'Haematinics'],
            ['GE12057', 'Folic acid 5mg tablet', 'Vitamins'],
            ['GE12059', 'Insulin soluble 100IU/mL', 'Antidiabetics'],
            ['GE12060', 'Oral rehydration salts sachet', 'Rehydration'],
            ['GE12061', 'Cotrimoxazole 480mg tablet', 'Antibiotics'],
            ['GE12062', 'Metronidazole 400mg tablet', 'Antiprotozoals'],
            ['GE12063', 'Diclofenac 50mg tablet', 'NSAIDs'],
            ['GE12064', 'Hydrochlorothiazide 25mg tablet', 'Diuretics'],
            ['GE12065', 'Losartan 50mg tablet', 'Antihypertensives'],
            ['GE12066', 'Atorvastatin 20mg tablet', 'Statins'],
            ['GE12067', 'Azithromycin 500mg tablet', 'Antibiotics'],
        ];

        $concepts = array_map(fn ($r) => [
            'code' => $r[0],
            'title' => $r[1],
            'definition' => "Standardized drug: {$r[1]}",
            'chapter_code' => null,
            'chapter_title' => 'Essential medicines',
            'block_code' => 'KEML-' . substr(md5($r[2]), 0, 3),
            'block_title' => $r[2],
            'parent_code' => null,
            'is_leaf' => true,
            'synonyms' => [],
            'inclusions' => [],
            'exclusions' => [],
            'indexing_references' => [],
            'raw_data' => ['system' => 'KEML', 'revision' => '2024', 'category' => $r[2]],
        ], $rows);

        return ['concepts' => $concepts, 'mappings' => []];
    }

    private function seedLoinc(): array
    {
        $rows = [
            ['2345-7', 'Glucose [Mass/volume] in Serum or Plasma', 'Chemistry'],
            ['2160-0', 'Creatinine [Mass/volume] in Serum or Plasma', 'Chemistry'],
            ['718-7', 'Hemoglobin [Mass/volume] in Blood', 'Hematology'],
            ['4544-3', 'Hematocrit [Volume Fraction] of Blood', 'Hematology'],
            ['777-3', 'Platelets [#/volume] in Blood', 'Hematology'],
            ['6690-2', 'Leukocytes [#/volume] in Blood', 'Hematology'],
            ['2823-3', 'Potassium [Moles/volume] in Serum or Plasma', 'Chemistry'],
            ['2951-2', 'Sodium [Moles/volume] in Serum or Plasma', 'Chemistry'],
            ['1975-2', 'Bilirubin.total [Mass/volume] in Serum or Plasma', 'Chemistry'],
            ['1742-6', 'Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma', 'Chemistry'],
        ];

        $concepts = array_map(fn ($r) => [
            'code' => $r[0],
            'title' => $r[1],
            'definition' => "LOINC observation code — {$r[1]}",
            'chapter_code' => null,
            'chapter_title' => 'Laboratory observations',
            'block_code' => 'LOINC-' . substr(md5($r[2]), 0, 3),
            'block_title' => $r[2],
            'parent_code' => null,
            'is_leaf' => true,
            'synonyms' => [],
            'inclusions' => [],
            'exclusions' => [],
            'indexing_references' => [],
            'raw_data' => ['system' => 'LOINC', 'revision' => '2.77', 'category' => $r[2]],
        ], $rows);

        return ['concepts' => $concepts, 'mappings' => []];
    }
}