<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_connections', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->unique();

            $table->string('environment', 20)->default('uat');
            $table->string('hie_base_url', 300);

            $table->text('client_id')->nullable();
            $table->text('client_secret_encrypted')->nullable();
            $table->text('api_key_encrypted')->nullable();
            $table->string('facility_fr_code', 60)->nullable();
            $table->string('facility_name', 200)->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamp('last_verified_at')->nullable();
            $table->string('last_verified_status', 20)->nullable();
            $table->unsignedInteger('last_verified_latency_ms')->nullable();
            $table->unsignedSmallInteger('last_verified_http_status')->nullable();
            $table->text('last_verified_error')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->timestamps();

            $table->index('environment');
            $table->index('is_active');
            $table->index('last_verified_status');
        });

        Schema::create('tenant_connection_logs', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('action', 30);
            $table->string('status', 20);
            $table->text('message')->nullable();
            $table->jsonb('meta')->nullable();
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('actor_email')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'created_at']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_connection_logs');
        Schema::dropIfExists('tenant_connections');
    }
};