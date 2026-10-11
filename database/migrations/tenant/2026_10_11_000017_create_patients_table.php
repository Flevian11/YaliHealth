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
            $table->string('patient_number', 40)->unique();

            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 20)->nullable();

            $table->string('phone', 40)->nullable();
            $table->string('email')->nullable();
            $table->string('national_id', 40)->nullable();
            $table->string('sha_id', 60)->nullable();
            $table->string('cr_number', 60)->nullable(); // HIE client registry id

            $table->string('insurance_type', 30)->default('cash'); // cash, sha, private
            $table->string('county')->nullable();
            $table->string('village')->nullable();

            $table->jsonb('next_of_kin')->default('{}');
            $table->jsonb('allergies')->default('[]');
            $table->text('notes')->nullable();

            $table->unsignedBigInteger('registered_by')->nullable();
            $table->timestamp('first_visit_at')->nullable();
            $table->timestamps();

            $table->index('patient_number');
            $table->index('national_id');
            $table->index('phone');
            $table->index('cr_number');
            $table->index('first_visit_at');
        });

        // Sequence counter for patient numbers per tenant
        Schema::create('patient_number_sequences', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('year');
            $table->unsignedBigInteger('last_number')->default(0);
            $table->timestamps();
            $table->unique('year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_number_sequences');
        Schema::dropIfExists('patients');
    }
};