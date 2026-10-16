<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->string('principal_cr_number', 60)->nullable()->after('cr_number');
            $table->string('principal_name', 200)->nullable()->after('principal_cr_number');
            $table->string('relationship_to_principal', 40)->nullable()->after('principal_name');

            $table->index('principal_cr_number');
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropIndex(['principal_cr_number']);
            $table->dropColumn(['principal_cr_number', 'principal_name', 'relationship_to_principal']);
        });
    }
};