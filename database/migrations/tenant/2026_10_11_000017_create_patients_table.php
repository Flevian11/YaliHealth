<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();

            // Local identity — the primary key for everything in this tenant
            $table->string('patient_number', 40)->unique();

            // Local demographics (always present)
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 20)->nullable();

            // Contact (always present, may be partial)
            $table->string('phone', 40)->nullable();
            $table->string('email')->nullable();
            $table->string('county')->nullable();
            $table->string('village')->nullable();

            // National identity (may or may not resolve)
            $table->string('national_id', 40)->nullable();
            $table->string('sha_id', 60)->nullable();
            $table->string('cr_number', 60)->nullable();  // HIE Client Registry ID

            // Verification state — the badge the receptionist sees
            $table->string('verification_status', 20)->default('local_only');
            // local_only | unverified | verified | not_found | failed
            $table->unsignedSmallInteger('verification_attempts')->default(0);
            $table->timestamp('last_verified_at')->nullable();
            $table->text('last_verification_error')->nullable();

            // Clinical notes captured at registration
            $table->jsonb('next_of_kin')->default('{}');
            $table->jsonb('allergies')->default('[]');
            $table->text('notes')->nullable();

            // Duplicate handling
            $table->unsignedBigInteger('merged_into_id')->nullable();

            // Audit
            $table->unsignedBigInteger('registered_by')->nullable();
            $table->timestamp('first_visit_at')->nullable();
            $table->timestamps();

            $table->index('patient_number');
            $table->index('national_id');
            $table->index('phone');
            $table->index('cr_number');
            $table->index('verification_status');
            $table->index('first_visit_at');
            $table->index('merged_into_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};