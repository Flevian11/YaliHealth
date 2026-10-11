<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('require_email_otp')->default(true)->after('role');
            $table->string('email_otp_code', 64)->nullable()->after('require_email_otp');
            $table->timestamp('email_otp_expires_at')->nullable()->after('email_otp_code');
            $table->timestamp('last_login_at')->nullable()->after('email_otp_expires_at');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'require_email_otp',
                'email_otp_code',
                'email_otp_expires_at',
                'last_login_at',
                'last_login_ip',
            ]);
        });
    }
};