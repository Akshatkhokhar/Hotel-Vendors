const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Inquiry-received notification sent to the VENDOR.
 * @param {object} opts
 * @param {string} opts.vendorName - Vendor company name.
 * @param {string} opts.senderName - Name of the person who sent the inquiry.
 * @param {string} opts.senderEmail - Email of the sender.
 * @param {string} opts.subject - Inquiry subject line.
 * @param {string} opts.messagePreview - First ~200 chars of the message body.
 * @param {string} opts.inquiryId - UUID for deep-linking into dashboard.
 * @returns {string} HTML string.
 */
export function inquiryReceivedTemplate({ vendorName, senderName, senderEmail, subject, messagePreview, inquiryId }: { vendorName: string, senderName: string, senderEmail: string, subject: string, messagePreview: string, inquiryId: string }): string {
  const dashboardLink = `${APP_URL}/dashboard/inquiries/${inquiryId}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>New Inquiry Received</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background-color:#4F7575;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">New Inquiry Received</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;color:#555;font-size:16px;line-height:1.6;">
              Hello <strong>${vendorName}</strong>,
            </p>
            <p style="margin:0 0 24px;color:#555;font-size:16px;line-height:1.6;">
              You have received a new inquiry on HotelVendors.com.
            </p>

            <!-- Sender details -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:6px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px;">
                  <p style="margin:0 0 6px;color:#333;font-size:14px;"><strong>From:</strong> ${senderName} (${senderEmail})</p>
                  <p style="margin:0 0 6px;color:#333;font-size:14px;"><strong>Subject:</strong> ${subject}</p>
                </td>
              </tr>
            </table>

            <!-- Message preview -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid #4F7575;margin-bottom:32px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;color:#555;font-size:15px;line-height:1.6;font-style:italic;">
                    "${messagePreview}"
                  </p>
                </td>
              </tr>
            </table>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background-color:#4F7575;border-radius:6px;">
                  <a href="${dashboardLink}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;">
                    View &amp; Reply in Dashboard
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
