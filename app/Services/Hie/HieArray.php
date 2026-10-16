<?php

namespace App\Services\Hie;

class HieArray
{
    /**
     * Recursively convert camelCase keys to snake_case.
     * Values are left untouched (only keys are transformed).
     */
    public static function snakify(array $input): array
    {
        $out = [];

        foreach ($input as $key => $value) {
            $newKey = is_string($key) ? self::snake($key) : $key;

            if (is_array($value)) {
                // Preserve list arrays as lists, associative arrays as maps
                $out[$newKey] = array_is_list($value)
                    ? array_map(fn ($v) => is_array($v) ? self::snakify($v) : $v, $value)
                    : self::snakify($value);
            } else {
                $out[$newKey] = $value;
            }
        }

        return $out;
    }

    private static function snake(string $key): string
    {
        // ID → id, URL → url, SHAID → sha_id, paymentMechanism → payment_mechanism
        $key = preg_replace('/([a-z0-9])([A-Z])/', '$1_$2', $key);
        $key = preg_replace('/([A-Z]+)([A-Z][a-z])/', '$1_$2', $key);

        return strtolower($key);
    }
}