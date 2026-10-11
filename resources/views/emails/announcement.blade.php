<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">

                    {{-- Header --}}
                    <tr>
                        <td style="padding:24px 32px;border-bottom:1px solid #e2e8f0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="vertical-align:middle;">
                                        <span style="font-size:15px;font-weight:600;color:#0f172a;">{{ $brand }}</span>
                                    </td>
                                    <td align="right" style="vertical-align:middle;">
                                        @php
                                            $catLabels = [
                                                'general' => 'Announcement',
                                                'billing' => 'Billing',
                                                'usage' => 'Usage Report',
                                                'feature' => 'New Feature',
                                                'advert' => 'Product',
                                                'maintenance' => 'Maintenance',
                                            ];
                                            $catLabel = $catLabels[$category] ?? ucfirst($category);
                                        @endphp
                                        <span style="display:inline-block;padding:4px 10px;background:#ecfdf5;color:#047857;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-radius:9999px;">
                                            {{ $catLabel }}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 6px;font-size:13px;color:#64748b;">
                                To {{ $hospitalName }}
                            </p>
                            <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">
                                {{ $title }}
                            </h1>
                            <div style="font-size:15px;line-height:1.7;color:#334155;white-space:pre-wrap;">{{ $body }}</div>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                                This message was sent by {{ $brand }} to hospital administrators.<br>
                                If you have questions, reply to this email.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>