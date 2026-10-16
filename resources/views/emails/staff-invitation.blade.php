<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Staff invitation</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1f5f9;padding:40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background:#ffffff;border-radius:16px;box-shadow:0 2px 12px rgba(15,23,42,0.06);overflow:hidden;">
                    <tr>
                        <td style="padding:32px 32px 24px;">
                            <div style="display:inline-block;padding:6px 12px;border-radius:9999px;background:#ecfdf5;color:#065f46;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                                Staff invitation
                            </div>
                            <h1 style="margin:16px 0 8px;font-size:22px;font-weight:700;line-height:1.3;">
                                Welcome, {{ $user->name }}
                            </h1>
                            <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">
                                {{ $invitedByName }} has invited you to join
                                <strong style="color:#0f172a;">{{ $hospitalName }}</strong>
                                on YaliHealth.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 32px 24px;">
                            <p style="margin:0 0 20px;color:#334155;font-size:14px;line-height:1.6;">
                                Click the button below to set your password. The
                                link is unique to you and expires in 7 days.
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center" style="border-radius:10px;background:#059669;">
                                        <a href="{{ $acceptUrl }}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;border-radius:10px;">
                                            Set your password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 32px 32px;">
                            <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">
                                Or copy this link into your browser:
                            </p>
                            <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;font-size:11px;color:#64748b;word-break:break-all;">
                                {{ $acceptUrl }}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                            <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                                Didn't expect this email? You can safely ignore it —
                                no account will be activated without clicking the link.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>