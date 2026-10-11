<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use App\Support\Settings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/Settings', [
            'groups' => Settings::catalog(),
            'values' => Settings::all(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $input = $request->input('settings', []);

        // Build validation rules dynamically from the catalog
        $rules = [];
        foreach (Settings::catalog() as $group) {
            foreach ($group['settings'] as $key => $meta) {
                $field = "settings.{$key}";
                $rules[$field] = match ($meta['type'] ?? 'text') {
                    'number' => ['nullable', 'integer', 'min:0'],
                    'boolean' => ['boolean'],
                    'email' => ['nullable', 'email', 'max:150'],
                    'select' => isset($meta['options'])
                        ? ['nullable', 'string', 'in:' . implode(',', array_keys($meta['options']))]
                        : ['nullable', 'string'],
                    'textarea' => ['nullable', 'string', 'max:1000'],
                    default => ['nullable', 'string', 'max:300'],
                };
            }
        }

        $validated = $request->validate($rules);

        $changed = [];
        foreach (Settings::catalog() as $group) {
            foreach ($group['settings'] as $key => $meta) {
                $value = $input[$key] ?? null;

                if ($meta['type'] === 'boolean') {
                    $value = (bool) ($input[$key] ?? false);
                }

                if ($value === '' || $value === null) {
                    // Fall back to default for empty values
                    Settings::put($key, $meta['default'] ?? null);
                } else {
                    Settings::put($key, $value);
                }

                $changed[$key] = $value;
            }
        }

        AuditLogger::log('settings.updated', [
            'keys' => array_keys($changed),
        ]);

        return back()->with('success', 'Settings saved.');
    }
}