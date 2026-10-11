<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_health_checks', function (Blueprint $table) {
            $table->id();
            $table->string('endpoint_key', 80);
            $table->string('endpoint_label', 180);
            $table->string('method', 10);
            $table->string('url', 500);
            $table->string('category', 30);
            $table->string('status', 20); // up, down, degraded, unknown
            $table->unsignedInteger('latency_ms')->nullable();
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->text('error_message')->nullable();
            $table->jsonb('response_meta')->nullable();
            $table->timestamp('checked_at');
            $table->timestamps();

            $table->index(['endpoint_key', 'checked_at']);
            $table->index('status');
            $table->index('checked_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_health_checks');
    }
};