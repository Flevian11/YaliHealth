<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visits', function (Blueprint $table) {
            $table->id();

            // Human-readable visit number, e.g. KAK-V-QJK7Y2X9M3
            $table->string('visit_number', 40)->unique();

            // Patient link (local + national)
            $table->unsignedBigInteger('patient_id');
            $table->string('cr_number', 60)->nullable();

            // Classification
            $table->string('visit_type', 20);                    // OP | IP | EMERGENCY
            $table->string('payment_mode', 30)->default('pending'); // sha | cash | private_insurance | pending
            $table->string('service_type', 30)->nullable();      // OUTPATIENT | INPATIENT | EMERGENCY | CAPITATION
            $table->smallInteger('scenario')->nullable();         // 1..8, null until routed

            // Fund / flags (cached from intervention response)
            $table->string('fund', 20)->nullable();              // SHIF | UHC | ECCIF
            $table->string('payment_mechanism', 30)->nullable(); // PER_DIEM | FEE_FOR_SERVICE | CAPITATION
            $table->boolean('needs_preauth')->default(false);
            $table->boolean('needs_elective_preauth')->default(false);

            // Consent artefacts
            $table->text('consent_token')->nullable();
            $table->string('auth_guid', 80)->nullable();
            $table->string('hie_visit_ref', 80)->nullable();

            // Claim state machine
            $table->string('claim_status', 30)->default('draft');
            // draft | visit_created | preauthed | submitted | accepted | rejected | closed

            // Lifecycle timestamps
            $table->timestamp('admitted_at')->nullable();
            $table->timestamp('discharged_at')->nullable();
            $table->string('discharge_reason', 40)->nullable();  // RECOVERED | REFERRED | ABSCONDED | OTHER
            $table->timestamp('emergency_deadline_at')->nullable(); // ECCIF only — 24h window
            $table->timestamp('closed_at')->nullable();

            // Future: private insurance
            $table->unsignedBigInteger('private_insurer_id')->nullable();

            // Audit
            $table->unsignedBigInteger('opened_by')->nullable();
            $table->unsignedBigInteger('closed_by')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->foreign('patient_id')->references('id')->on('patients')->cascadeOnDelete();

            $table->index('patient_id');
            $table->index('claim_status');
            $table->index('payment_mode');
            $table->index('scenario');
            $table->index('created_at');
            $table->index('emergency_deadline_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visits');
    }
};