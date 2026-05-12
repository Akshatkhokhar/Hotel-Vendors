const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Welcome email template.
 * @param {object} opts
 * @param {string} opts.name - User's display name.
 * @param {'vendor'|'hotel_owner'} opts.role - User role.
 * @returns {string} HTML string.
 */
export function welcomeTemplate({ name, role }: { name: string, role: string }): string {
  const isVendor = role === 'vendor';
  const headline = isVendor
    ? 'Complete Your Vendor Profile'
    : 'Start Browsing Suppliers';
  const body = isVendor
    ? 'Add your company details, logo, and services so hotel owners can discover you.'
    : 'Search our directory of 500+ verified hospitality suppliers to find exactly what you need.';
  const ctaText = isVendor ? 'Set Up My Profile' : 'Browse Vendors';
  const ctaLink = isVendor
    ? `${APP_URL}/dashboard/vendor/profile`
    : `${APP_URL}/vendors`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Welcome to HotelVendors</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background-color:#4F7575;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">HotelVendors.com</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px;">Welcome, ${name}!</h2>
            <p style="margin:0 0 24px;color:#555;font-size:16px;line-height:1.6;">
              Your account has been created successfully. You're now part of the premier B2B marketplace connecting hotel owners with hospitality suppliers.
            </p>

            <h3 style="margin:0 0 8px;color:#4F7575;font-size:18px;">Next Step: ${headline}</h3>
            <p style="margin:0 0 32px;color:#555;font-size:16px;line-height:1.6;">
              ${body}
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background-color:#4F7575;border-radius:6px;">
                  <a href="${ctaLink}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;">
                    ${ctaText}
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
