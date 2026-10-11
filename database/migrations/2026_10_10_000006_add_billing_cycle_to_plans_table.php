<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->unsignedInteger('setup_fee')->default(0)->after('price_yearly');
            $table->string('billing_cycle', 20)->default('monthly')->after('setup_fee');
            $table->unsignedSmallInteger('billing_cycle_months')->default(1)->after('billing_cycle');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['setup_fee', 'billing_cycle', 'billing_cycle_months']);
        });
    }
};