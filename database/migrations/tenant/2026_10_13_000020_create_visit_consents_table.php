<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visit_consents', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('visit_id');
            $table->unsignedBigInteger('patient_id');

            // Purpose in the visit lifecycle
            $table->string('purpose', 30)->default('visit_start');
            // visit_start | preauth | visit_end | discharge

            // Method
            $table->string('method', 20);      // otp | biometric

            // OTP artefacts
            $table->string('contact_id', 40)->nullable();
            $table->string('contact_masked', 40)->nullable();
            $table->timestamp('otp_sent_at')->nullable();
            $table->timestamp('otp_verified_at')->nullable();

            // Biometric artefacts
            $table->string('auth_guid', 80)->nullable();
            $table->string('authorization_status', 40)->nullable(); // PENDING | AUTHORIZED | AUTHORIZED_PENDING_VISIT

            // Result
            $table->text('consent_token')->nullable();
            $table->string('status', 30)->default('pending');
            // pending | sent | verified | expired | cancelled | failed

            // Raw HIE response — full audit trail
            $table->jsonb('hie_response')->default('{}');

            $table->timestamp('expires_at')->nullable();

            // Actor
            $table->unsignedBigInteger('captured_by')->nullable();

            $table->timestamps();

            $table->foreign('visit_id')->references('id')->on('visits')->cascadeOnDelete();
            $table->foreign('patient_id')->references('id')->on('patients')->cascadeOnDelete();

            $table->index('visit_id');
            $table->index('patient_id');
            $table->index('status');
            $table->index('purpose');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visit_consents');
    }
};