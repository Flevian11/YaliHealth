<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visit_interventions', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('visit_id');
            $table->string('intervention_code', 60);
            $table->string('name', 300)->nullable();

            // Cached flags from the HIE response so the UI never round-trips
            $table->string('fund', 20)->nullable();
            $table->string('payment_mechanism', 30)->nullable();
            $table->string('access_point', 10)->nullable();      // OP | IP
            $table->boolean('needs_preauth')->default(false);
            $table->boolean('needs_elective_preauth')->default(false);
            $table->integer('tariff')->nullable();               // facility-level tariff amount

            // Raw HIE response — full snapshot
            $table->jsonb('flags')->default('{}');

            // Per-intervention lifecycle
            $table->string('status', 30)->default('pending');
            // pending | active | preauthed | billed | retired | switched

            $table->string('preauth_code', 60)->nullable();
            $table->timestamp('preauth_finalised_at')->nullable();

            $table->unsignedBigInteger('added_by')->nullable();
            $table->timestamp('retired_at')->nullable();

            $table->timestamps();

            $table->foreign('visit_id')->references('id')->on('visits')->cascadeOnDelete();

            $table->index('visit_id');
            $table->index('intervention_code');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visit_interventions');
    }
};