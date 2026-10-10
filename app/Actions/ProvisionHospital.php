<?php

namespace App\Actions;

use App\Models\Tenant;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class ProvisionHospital
{
    public function execute(array $data): Tenant
    {
        $slug = $this->generateUniqueSlug($data['name']);
        $tenantId = str_replace('-', '_', $slug);

        $tenant = Tenant::create([
            'id' => $tenantId,
            'name' => $data['name'],
            'admin_name' => $data['admin_name'],
            'admin_email' => $data['admin_email'],
            'phone' => $data['phone'] ?? null,
            'status' => 'active',
        ]);

        try {
            $tenant->domains()->create(['domain' => $slug]);

            $tenant->run(function () use ($data) {
                User::create([
                    'name' => $data['admin_name'],
                    'email' => $data['admin_email'],
                    'password' => $data['admin_password'],
                    'role' => 'hospital_admin',
                    'email_verified_at' => now(),
                ]);
            });
        } catch (Throwable $e) {
            $tenant->delete();
            throw $e;
        }

        AuditLogger::log(
            'hospital.created',
            [
                'name' => $tenant->name,
                'domain' => $slug,
                'admin_email' => $data['admin_email'],
            ],
            $tenant,
        );

        return $tenant;
    }

    private function generateUniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'hospital';
        $slug = $base;
        $i = 1;

        while ($this->slugInUse($slug)) {
            $i++;
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }

    private function slugInUse(string $slug): bool
    {
        if (DB::table('domains')->where('domain', $slug)->exists()) {
            return true;
        }

        return Tenant::find(str_replace('-', '_', $slug)) !== null;
    }
}