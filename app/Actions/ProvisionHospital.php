<?php

namespace App\Actions;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class ProvisionHospital
{
    public function execute(array $data): Tenant
    {
        $slug = Str::slug($data['name']);
        $tenantId = str_replace('-', '_', $slug);

        if (Tenant::find($tenantId)) {
            throw new RuntimeException("A hospital with a similar name already exists.");
        }

        if (DB::table('domains')->where('domain', $slug)->exists()) {
            throw new RuntimeException("The domain \"{$slug}\" is already taken.");
        }

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

        return $tenant;
    }
}