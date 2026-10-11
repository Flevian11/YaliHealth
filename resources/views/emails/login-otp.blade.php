<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Your sign-in code</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">

                    {{-- Header --}}
                    <tr>
                        <td style="padding:24px 32px;border-bottom:1px solid #e2e8f0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="vertical-align:middle;">
                                        <span style="font-size:15px;font-weight:600;color:#0f172a;">{{ $brand }}</span>
                                        @if ($hospitalName)
                                            <div style="font-size:11px;color:#94a3b8;margin-top:2px;">{{ $hospitalName }}</div>
                                        @endif
                                    </td>
                                    <td align="right" style="vertical-align:middle;">
                                        <span style="display:inline-block;padding:4px 10px;background:#ecfdf5;color:#047857;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-radius:9999px;">
                                            Sign-in code
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 8px;font-size:15px;color:#334155;">
                                Hi {{ $user->name }},
                            </p>
                            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#64748b;">
                                Use the code below to finish signing in to your account.
                            </p>

                            {{-- OTP code --}}
                            <div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                                <div style="font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;">
                                    Your code
                                </div>
                                <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0f172a;font-family:'SF Mono',Menlo,Monaco,Consolas,monospace;">
                                    {{ $code }}
                                </div>
                            </div>

                            <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#64748b;">
                                This code expires in <strong style="color:#0f172a;">{{ $expiryMinutes }} minutes</strong>.
                            </p>

                            <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
                                If you didn't try to sign in, someone may have your password. Change it immediately.
                            </p>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                                For your security, never share this code with anyone.
                                {{ $brand }} will never ask you for it by phone or email.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>