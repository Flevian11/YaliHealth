<?php

namespace App\Support;

use App\Models\Setting;

class Settings
{
    public static function catalog(): array
    {
        return config('settings.groups', []);
    }

    public static function allKeys(): array
    {
        $keys = [];
        foreach (static::catalog() as $group) {
            foreach (array_keys($group['settings']) as $key) {
                $keys[] = $key;
            }
        }
        return $keys;
    }

    public static function meta(string $key): ?array
    {
        foreach (static::catalog() as $group) {
            if (isset($group['settings'][$key])) {
                return $group['settings'][$key];
            }
        }
        return null;
    }

    public static function all(): array
    {
        $values = [];
        foreach (static::catalog() as $group) {
            foreach ($group['settings'] as $key => $meta) {
                $raw = Setting::get($key, null);
                $values[$key] = $raw === null
                    ? $meta['default'] ?? null
                    : static::cast($raw, $meta['type'] ?? 'text');
            }
        }
        return $values;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $meta = static::meta($key);
        $raw = Setting::get($key, null);

        if ($raw === null) {
            return $meta['default'] ?? $default;
        }

        return static::cast($raw, $meta['type'] ?? 'text');
    }

    public static function put(string $key, mixed $value): void
    {
        Setting::put($key, static::serialize($value));
    }

    private static function cast(?string $raw, string $type): mixed
    {
        return match ($type) {
            'number' => is_numeric($raw) ? (int) $raw : 0,
            'boolean' => $raw === '1' || $raw === 'true' || $raw === 1,
            default => $raw,
        };
    }

    private static function serialize(mixed $value): ?string
    {
        if (is_bool($value)) {
            return $value ? '1' : '0';
        }
        if (is_null($value)) {
            return null;
        }
        return (string) $value;
    }
}