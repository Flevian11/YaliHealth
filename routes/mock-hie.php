<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Mock HIE — development only
|--------------------------------------------------------------------------
| These routes stand in for the DHA middleware during local development.
| They are registered on the central domain only, and only when
| HIE_ENVIRONMENT=mock.
|
| They are never registered in production because bootstrap/app.php
| guards the include.
*/

Route::prefix('mock-hie')->group(function () {

    // Minimal biometric iframe — a real deployment embeds the DHA-hosted page
    Route::get('biometric-iframe', function (\Illuminate\Http\Request $request) {
        $guid = $request->query('guid', '00000000-0000-0000-0000-000000000000');

        return response(<<<HTML
            <!DOCTYPE html>
            <html>
            <head>
                <title>Mock Biometric</title>
                <style>
                    body { font-family: system-ui, sans-serif; padding: 2rem; background: #f8fafc; }
                    .card { max-width: 420px; margin: 4rem auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); text-align: center; }
                    h1 { font-size: 1.125rem; margin: 0 0 0.5rem; }
                    p { color: #64748b; font-size: 0.875rem; }
                    button { margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #059669; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
                    button:hover { background: #047857; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>Mock Biometric Verification</h1>
                    <p>GUID: <code>{$guid}</code></p>
                    <p>Click below to simulate a successful fingerprint match.</p>
                    <button onclick="notify()">Simulate Fingerprint Match</button>
                </div>
                <script>
                    function notify() {
                        window.parent.postMessage({ type: 'hie.biometric.authorized', guid: '{$guid}' }, '*');
                    }
                </script>
            </body>
            </html>
            HTML);
    });
});