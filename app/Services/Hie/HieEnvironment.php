<?php

namespace App\Services\Hie;

class HieEnvironment
{
    public function name(): string
    {
        return (string) config('hie.environment', 'mock');
    }

    public function baseUrl(): string
    {
        $urls = config('hie.base_urls', []);
        $key = $this->name();

        if (! isset($urls[$key])) {
            throw new \RuntimeException("No HIE base URL configured for environment: {$key}");
        }

        return rtrim($urls[$key], '/');
    }

    public function isMock(): bool
    {
        return $this->name() === 'mock';
    }

    public function isProduction(): bool
    {
        return $this->name() === 'production';
    }
}