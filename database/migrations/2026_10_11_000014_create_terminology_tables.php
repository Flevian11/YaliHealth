<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('terminology_concepts', function (Blueprint $table) {
            $table->id();
            $table->string('source', 40); // ICD-11, KEML, LOINC
            $table->string('code', 60);
            $table->string('title', 500);
            $table->text('definition')->nullable();
            $table->string('chapter_code', 20)->nullable();
            $table->string('chapter_title', 300)->nullable();
            $table->string('block_code', 30)->nullable();
            $table->string('block_title', 300)->nullable();
            $table->string('parent_code', 60)->nullable();
            $table->boolean('is_leaf')->default(true);
            $table->jsonb('synonyms')->default('[]');
            $table->jsonb('inclusions')->default('[]');
            $table->jsonb('exclusions')->default('[]');
            $table->jsonb('indexing_references')->default('[]');
            $table->jsonb('raw_data')->default('{}');
            $table->timestamp('synced_at');
            $table->timestamps();

            $table->unique(['source', 'code']);
            $table->index('source');
            $table->index('chapter_code');
            $table->index('parent_code');
            $table->index('synced_at');
        });

        Schema::create('terminology_mappings', function (Blueprint $table) {
            $table->id();
            $table->string('source', 40);
            $table->string('from_code', 60);
            $table->string('to_code', 60);
            $table->string('to_source', 40);
            $table->string('to_title', 500)->nullable();
            $table->string('map_type', 40); // has-child, has-parent, equivalent-to
            $table->timestamp('synced_at');
            $table->timestamps();

            $table->index(['source', 'from_code']);
            $table->index('map_type');
            $table->index(['to_source', 'to_code']);
        });

        Schema::create('terminology_sync_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('source', 40);
            $table->string('status', 20)->default('queued');
            $table->unsignedInteger('concepts_fetched')->default(0);
            $table->unsignedInteger('concepts_created')->default(0);
            $table->unsignedInteger('concepts_updated')->default(0);
            $table->unsignedInteger('mappings_created')->default(0);
            $table->unsignedInteger('duration_ms')->nullable();
            $table->text('error_message')->nullable();
            $table->jsonb('meta')->nullable();
            $table->unsignedBigInteger('triggered_by')->nullable();
            $table->string('trigger_source', 20)->default('manual');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['source', 'created_at']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('terminology_sync_jobs');
        Schema::dropIfExists('terminology_mappings');
        Schema::dropIfExists('terminology_concepts');
    }
};