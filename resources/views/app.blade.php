<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="scroll-smooth">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    @php
        $brand = $theme['brand'] ?? config('app.name', 'YaliHealth');
    @endphp

    <title inertia>{{ $brand }}</title>
    <meta name="application-name" content="{{ $brand }}">
    <meta name="theme-color" content="#059669">
    <meta name="color-scheme" content="light dark">

    <meta name="robots" content="noindex, nofollow">
    <meta name="description" content="{{ $brand }} — secure multi-tenant hospital management system connected to Kenya's Health Information Exchange.">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="{{ $brand }}">
    <meta property="og:title" content="{{ $brand }}">
    <meta property="og:description" content="Secure multi-tenant hospital management, connected to Kenya's Health Information Exchange.">
    <meta property="og:url" content="{{ request()->url() }}">

    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{{ $brand }}">
    <meta name="twitter:description" content="Secure multi-tenant hospital management.">

    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" type="image/png" href="/images/logo.png">
    <link rel="apple-touch-icon" href="/images/logo.png">

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet">

    <style>
        :root {
            --font-sans: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif;
        }
    </style>

    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>
<body class="min-h-svh bg-background font-sans text-foreground antialiased">
    @inertia
</body>
</html>