<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 60)->unique();
            $table->string('name', 120);
            $table->string('description', 300)->nullable();
            $table->jsonb('permissions')->default('[]');
            $table->boolean('is_system')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Seed the three system roles
        $now = now();

        DB::table('roles')->insert([
            [
                'slug' => 'owner',
                'name' => 'Owner',
                'description' => 'Full control over the entire platform.',
                'permissions' => json_encode(['*']),
                'is_system' => true,
                'sort_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'admin',
                'name' => 'Admin',
                'description' => 'Manages hospitals, plans, and announcements. Cannot manage super admins or roles.',
                'permissions' => json_encode([
                    'hospitals.view', 'hospitals.create', 'hospitals.edit', 'hospitals.suspend',
                    'hospitals.delete', 'hospitals.features',
                    'plans.view', 'plans.create', 'plans.edit', 'plans.delete',
                    'features.view', 'features.toggle',
                    'announcements.view', 'announcements.create', 'announcements.publish',
                    'announcements.delete',
                    'audit.view',
                    'settings.view',
                ]),
                'is_system' => true,
                'sort_order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'viewer',
                'name' => 'Viewer',
                'description' => 'Read-only access to hospitals, plans, and audit logs.',
                'permissions' => json_encode([
                    'hospitals.view',
                    'plans.view',
                    'features.view',
                    'announcements.view',
                    'audit.view',
                    'settings.view',
                ]),
                'is_system' => true,
                'sort_order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};