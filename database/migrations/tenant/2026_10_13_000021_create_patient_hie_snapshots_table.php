<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_hie_snapshots', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('patient_id');
            $table->unsignedBigInteger('visit_id')->nullable();

            $table->string('snapshot_type', 40);
            $table->jsonb('data')->default('{}');

            $table->timestamp('fetched_at');
            $table->timestamp('expires_at')->nullable();

            $table->timestamps();

            $table->foreign('patient_id')->references('id')->on('patients')->cascadeOnDelete();

            $table->index('patient_id');
            $table->index(['patient_id', 'snapshot_type']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_hie_snapshots');
    }
};