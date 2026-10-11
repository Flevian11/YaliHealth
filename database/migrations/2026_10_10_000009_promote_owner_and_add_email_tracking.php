<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add email delivery tracking to announcements
        Schema::table('announcements', function (Blueprint $table) {
            $table->unsignedInteger('emails_sent')->default(0)->after('published_at');
            $table->unsignedInteger('emails_failed')->default(0)->after('emails_sent');
        });

        // Promote the first super admin to owner if no owner exists yet
        $hasOwner = DB::table('super_admins')->where('role', 'owner')->exists();

        if (! $hasOwner) {
            DB::table('super_admins')
                ->orderBy('id')
                ->limit(1)
                ->update(['role' => 'owner']);
        }
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn(['emails_sent', 'emails_failed']);
        });
    }
};