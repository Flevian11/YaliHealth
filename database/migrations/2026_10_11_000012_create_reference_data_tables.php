<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reference_records', function (Blueprint $table) {
            $table->id();
            $table->string('registry_key', 60);
            $table->string('external_id', 120)->nullable();
            $table->string('code', 120)->nullable();
            $table->string('name', 300);
            $table->string('category', 120)->nullable();
            $table->string('status', 30)->nullable();
            $table->jsonb('data')->default('{}');
            $table->timestamp('synced_at');
            $table->timestamps();

            $table->index(['registry_key', 'code']);
            $table->index(['registry_key', 'name']);
            $table->index(['registry_key', 'category']);
            $table->index('synced_at');
        });

        Schema::create('reference_sync_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('registry_key', 60);
            $table->string('status', 20)->default('queued');
            $table->unsignedInteger('records_fetched')->default(0);
            $table->unsignedInteger('records_created')->default(0);
            $table->unsignedInteger('records_updated')->default(0);
            $table->unsignedInteger('records_failed')->default(0);
            $table->unsignedInteger('duration_ms')->nullable();
            $table->text('error_message')->nullable();
            $table->jsonb('meta')->nullable();
            $table->unsignedBigInteger('triggered_by')->nullable();
            $table->string('trigger_source', 20)->default('manual');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['registry_key', 'created_at']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reference_sync_jobs');
        Schema::dropIfExists('reference_records');
    }
};