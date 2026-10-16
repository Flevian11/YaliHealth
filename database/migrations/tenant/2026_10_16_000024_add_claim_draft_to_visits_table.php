<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visits', function (Blueprint $table) {
            $table->jsonb('claim_draft')->default('{}')->after('notes');
            $table->string('invoice_number', 60)->nullable()->after('claim_draft');
        });
    }

    public function down(): void
    {
        Schema::table('visits', function (Blueprint $table) {
            $table->dropColumn(['claim_draft', 'invoice_number']);
        });
    }
};