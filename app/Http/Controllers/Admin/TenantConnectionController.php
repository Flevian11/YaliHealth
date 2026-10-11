<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantConnection;
use App\Models\TenantConnectionLog;
use App\Services\TenantConnectionTester;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TenantConnectionController extends Controller
{
    public function index(Request $request): Response
    {
        $query = trim((string) $request->input('q', ''));
        $status = (string) $request->input('status', '');

        $tenants = Tenant::with('plan')
            ->when($query !== '', fn ($q) => $q->where(function ($sub) use ($query) {
                $like = "%{$query}%";
                $sub->whereRaw("data->>'name' ILIKE ?", [$like])
                    ->orWhere('id', 'ILIKE', $like);
            }))
            ->orderByRaw("data->>'name'")
            ->get();

        $connections = TenantConnection::whereIn('tenant_id', $tenants->pluck('id'))
            ->get()
            ->keyBy('tenant_id');

        $rows = $tenants->map(function (Tenant $t) use ($connections) {
            $conn = $connections->get($t->id);

            return [
                'tenant_id' => $t->id,
                'name' => $t->name ?? $t->id,
                'plan' => $t->plan?->name,
                'subscription_status' => $t->subscription_status,
                'connection' => $conn ? [
                    'id' => $conn->id,
                    'environment' => $conn->environment,
                    'status' => $conn->status(),
                    'is_ready' => $conn->isReady(),
                    'last_verified_at' => $conn->last_verified_at?->toIso8601String(),
                    'last_verified_status' => $conn->last_verified_status,
                    'last_verified_latency_ms' => $conn->last_verified_latency_ms,
                    'last_verified_error' => $conn->last_verified_error,
                    'facility_fr_code' => $conn->facility_fr_code,
                    'facility_name' => $conn->facility_name,
                ] : null,
            ];
        })
        ->when($status !== '', function ($collection) use ($status) {
            return $collection->filter(function ($row) use ($status) {
                $s = $row['connection']['status'] ?? 'not_configured';
                return $s === $status;
            });
        })
        ->values()
        ->all();

        $all = Tenant::with('plan')->get();
        $allConnections = TenantConnection::whereIn('tenant_id', $all->pluck('id'))->get()->keyBy('tenant_id');

        $stats = [
            'total' => $all->count(),
            'healthy' => 0,
            'failing' => 0,
            'incomplete' => 0,
            'unverified' => 0,
            'not_configured' => 0,
            'inactive' => 0,
        ];

        foreach ($all as $t) {
            $conn = $allConnections->get($t->id);
            $s = $conn ? $conn->status() : 'not_configured';
            if (isset($stats[$s])) {
                $stats[$s]++;
            }
        }

        return Inertia::render('admin/TenantConnections', [
            'connections' => $rows,
            'filters' => ['q' => $query, 'status' => $status],
            'stats' => $stats,
        ]);
    }

    public function show(string $tenantId): Response
    {
        $tenant = Tenant::with('plan', 'domains')->findOrFail($tenantId);
        $connection = TenantConnection::where('tenant_id', $tenantId)->first();

        $logs = TenantConnectionLog::where('tenant_id', $tenantId)
            ->orderByDesc('created_at')
            ->limit(30)
            ->get()
            ->map(fn (TenantConnectionLog $l) => [
                'id' => $l->id,
                'action' => $l->action,
                'status' => $l->status,
                'message' => $l->message,
                'meta' => $l->meta,
                'actor_email' => $l->actor_email,
                'ip_address' => $l->ip_address,
                'created_at' => $l->created_at->toIso8601String(),
            ])
            ->all();

        return Inertia::render('admin/TenantConnectionDetail', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name ?? $tenant->id,
                'plan' => $tenant->plan?->name,
                'status' => $tenant->status ?? 'active',
                'subscription_status' => $tenant->subscription_status,
                'domains' => $tenant->domains->pluck('domain')->all(),
                'admin_name' => $tenant->admin_name,
                'admin_email' => $tenant->admin_email,
            ],
            'connection' => $connection ? [
                'id' => $connection->id,
                'environment' => $connection->environment,
                'hie_base_url' => $connection->hie_base_url,
                'client_id' => $connection->client_id,
                'client_secret_masked' => $connection->maskedClientSecret(),
                'has_client_secret' => $connection->hasClientSecret(),
                'api_key_masked' => $connection->maskedApiKey(),
                'has_api_key' => $connection->hasApiKey(),
                'facility_fr_code' => $connection->facility_fr_code,
                'facility_name' => $connection->facility_name,
                'is_active' => $connection->is_active,
                'is_ready' => $connection->isReady(),
                'status' => $connection->status(),
                'last_verified_at' => $connection->last_verified_at?->toIso8601String(),
                'last_verified_status' => $connection->last_verified_status,
                'last_verified_latency_ms' => $connection->last_verified_latency_ms,
                'last_verified_http_status' => $connection->last_verified_http_status,
                'last_verified_error' => $connection->last_verified_error,
                'created_at' => $connection->created_at?->toIso8601String(),
            ] : null,
            'logs' => $logs,
            'environments' => [
                ['value' => 'uat', 'label' => 'UAT (testing)'],
                ['value' => 'production', 'label' => 'Production'],
            ],
            'default_base_urls' => [
                'uat' => 'https://ilm-dev.dha.go.ke/uat-middleware',
                'production' => 'https://ilm.dha.go.ke',
            ],
        ]);
    }

    public function upsert(Request $request, string $tenantId): RedirectResponse
    {
        $tenant = Tenant::findOrFail($tenantId);

        $data = $request->validate([
            'environment' => ['required', Rule::in(['uat', 'production'])],
            'hie_base_url' => ['required', 'url', 'max:300'],
            'client_id' => ['nullable', 'string', 'max:200'],
            'client_secret' => ['nullable', 'string', 'max:500'],
            'api_key' => ['nullable', 'string', 'max:500'],
            'facility_fr_code' => ['nullable', 'string', 'max:60'],
            'facility_name' => ['nullable', 'string', 'max:200'],
            'is_active' => ['boolean'],
        ]);

        $existing = TenantConnection::where('tenant_id', $tenantId)->first();
        $actor = Auth::guard('super_admin')->user();

        $isNew = ! $existing;
        $connection = $existing ?? new TenantConnection(['tenant_id' => $tenantId]);

        $connection->environment = $data['environment'];
        $connection->hie_base_url = rtrim($data['hie_base_url'], '/');
        $connection->client_id = $data['client_id'] ?? null;

        // Only overwrite secrets if a value was provided
        if (! empty($data['client_secret'])) {
            $connection->client_secret = $data['client_secret'];
        }
        if (! empty($data['api_key'])) {
            $connection->api_key = $data['api_key'];
        }

        $connection->facility_fr_code = $data['facility_fr_code'] ?? null;
        $connection->facility_name = $data['facility_name'] ?? null;
        $connection->is_active = $data['is_active'] ?? true;
        $connection->created_by = $existing?->created_by ?? $actor?->id;
        $connection->updated_by = $actor?->id;
        $connection->save();

        TenantConnectionLog::create([
            'tenant_id' => $tenantId,
            'action' => $isNew ? 'created' : 'updated',
            'status' => 'success',
            'message' => $isNew ? 'Connection created' : 'Connection updated',
            'meta' => [
                'environment' => $connection->environment,
                'facility_fr_code' => $connection->facility_fr_code,
                'credentials_rotated' => ! empty($data['client_secret']),
            ],
            'actor_id' => $actor?->id,
            'actor_email' => $actor?->email,
            'ip_address' => $request->ip(),
        ]);

        AuditLogger::log($isNew ? 'tenant_connection.created' : 'tenant_connection.updated', [
            'tenant_id' => $tenantId,
            'environment' => $connection->environment,
        ], $connection);

        return back()->with('success', $isNew ? 'Connection saved.' : 'Connection updated.');
    }

    public function test(string $tenantId, TenantConnectionTester $tester): RedirectResponse
    {
        $connection = TenantConnection::where('tenant_id', $tenantId)->firstOrFail();
        $actor = Auth::guard('super_admin')->user();

        $result = $tester->test($connection, $actor?->id, $actor?->email);

        if ($result['status'] === 'success') {
            return back()->with('success', "Connection verified in {$result['latency_ms']}ms.");
        }

        return back()->withErrors(['test' => $result['message'] ?? 'Connection test failed.']);
    }

    public function toggleActive(string $tenantId): RedirectResponse
    {
        $connection = TenantConnection::where('tenant_id', $tenantId)->firstOrFail();
        $connection->is_active = ! $connection->is_active;
        $connection->save();

        $actor = Auth::guard('super_admin')->user();

        TenantConnectionLog::create([
            'tenant_id' => $tenantId,
            'action' => $connection->is_active ? 'activated' : 'deactivated',
            'status' => 'success',
            'message' => $connection->is_active ? 'Connection enabled' : 'Connection disabled',
            'actor_id' => $actor?->id,
            'actor_email' => $actor?->email,
            'ip_address' => request()->ip(),
        ]);

        AuditLogger::log('tenant_connection.toggled', [
            'tenant_id' => $tenantId,
            'is_active' => $connection->is_active,
        ], $connection);

        return back()->with('success', $connection->is_active ? 'Connection enabled.' : 'Connection disabled.');
    }

    public function destroy(string $tenantId): RedirectResponse
    {
        $connection = TenantConnection::where('tenant_id', $tenantId)->firstOrFail();
        $connection->delete();

        $actor = Auth::guard('super_admin')->user();

        TenantConnectionLog::create([
            'tenant_id' => $tenantId,
            'action' => 'deleted',
            'status' => 'success',
            'message' => 'Connection removed',
            'actor_id' => $actor?->id,
            'actor_email' => $actor?->email,
            'ip_address' => request()->ip(),
        ]);

        AuditLogger::log('tenant_connection.deleted', ['tenant_id' => $tenantId]);

        return redirect()
            ->route('admin.tenant-connections.index')
            ->with('success', 'Connection removed.');
    }

    public function testAll(TenantConnectionTester $tester): RedirectResponse
    {
        $connections = TenantConnection::where('is_active', true)->get();
        $actor = Auth::guard('super_admin')->user();

        $success = 0;
        $failed = 0;

        foreach ($connections as $conn) {
            $result = $tester->test($conn, $actor?->id, $actor?->email);
            if ($result['status'] === 'success') $success++;
            else $failed++;
        }

        return back()->with('success', "Tested {$connections->count()} connections — {$success} healthy, {$failed} failing.");
    }
}