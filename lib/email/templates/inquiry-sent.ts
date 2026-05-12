const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Inquiry-sent confirmation sent to the SENDER (hotel owner / guest).
 * @param {object} opts
 * @param {string} opts.vendorName - Vendor company name.
 * @param {string} [opts.vendorPhone] - Vendor primary phone (if public).
 * @param {string} [opts.vendorEmail] - Vendor primary contact email (if public).
 * @param {string} opts.subject - Subject the sender used.
 * @returns {string} HTML string.
 */
export function inquirySentTemplate({ vendorName, vendorPhone, vendorEmail, subject }: { vendorName: string, vendorPhone: string, vendorEmail: string, subject: string }): string {
  const hasContact = vendorPhone || vendorEmail;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Inquiry Sent</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background-color:#4F7575;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Inquiry Sent Successfully</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;color:#555;font-size:16px;line-height:1.6;">
              Your inquiry to <strong>${vendorName}</strong> has been delivered.
            </p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Subject:</strong> ${subject}</p>

            ${hasContact ? `
            <!-- Vendor contact details -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:6px;margin:24px 0;">
              <tr>
                <td style="padding:20px;">
                  <p style="margin:0 0 4px;color:#4F7575;font-size:14px;font-weight:600;">Vendor Contact Details</p>
                  ${vendorPhone ? `<p style="margin:0 0 4px;color:#333;font-size:14px;">Phone: ${vendorPhone}</p>` : ''}
                  ${vendorEmail ? `<p style="margin:0;color:#333;font-size:14px;">Email: ${vendorEmail}</p>` : ''}
                </td>
              </tr>
            </table>
            ` : ''}

            <h3 style="margin:0 0 8px;color:#4F7575;font-size:16px;">What happens next?</h3>
            <ul style="margin:0 0 32px;padding-left:20px;color:#555;font-size:15px;line-height:1.8;">
              <li>The vendor has been notified via email.</li>
              <li>Most suppliers respond within <strong>1–2 business days</strong>.</li>
              <li>You'll receive an email notification when they reply.</li>
              <li>Track all your conversations in your dashboard.</li>
            </ul>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background-color:#4F7575;border-radius:6px;">
                  <a href="${APP_URL}/dashboard/inquiries" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;">
                    View My Inquiries
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background-color:#f9fafb;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0 0 8px;color:#999;font-size:13px;">&copy; ${new Date().getFullYear()} HotelVendors.com. All rights reserved.</p>
            <p style="margin:0;color:#999;font-size:12px;">
              <a href="${APP_URL}/unsubscribe" style="color:#4F7575;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
