import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase/admin';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = 'HotelVendors <noreply@hotelvendors.com>';

/**
 * Send an email via Resend and log the result to email_logs.
 * Email failures are caught and logged — they NEVER break the caller.
 *
 * @param {object} options
 * @param {string} options.to - Recipient email address.
 * @param {string} options.subject - Email subject.
 * @param {string} options.html - HTML body.
 * @param {string} [options.text] - Plain-text fallback body.
 * @param {string} [options.userId] - User ID for logging (optional).
 * @param {string} [options.type] - Email type for logging (e.g. 'welcome', 'inquiry_received').
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function sendEmail({ to, subject, html, text, userId, type }: { to: string, subject: string, html: string, text?: string, userId?: string, type?: string }): Promise<{success: boolean, id?: string, error?: string}> {
  let result: { success: boolean, id?: string, error?: string } = { success: false };

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });

    if (error) {
      console.error(`Email send error [${type}]:`, error);
      result = { success: false, error: error.message };
    } else {
      result = { success: true, id: data?.id };
    }
  } catch (err: any) {
    console.error(`Email send exception [${type}]:`, err);
    result = { success: false, error: err.message };
  }

  // Log to email_logs — fire and forget
  logEmail({ to, subject, type, userId, ...result }).catch(() => {});

  return result;
}

/**
 * Log email send attempt to email_logs table.
 */
async function logEmail({ to, subject, type, userId, success, id, error }: { to: string, subject: string, type?: string, userId?: string, success: boolean, id?: string, error?: string }) {
  try {
    await supabaseAdmin.from('email_logs').insert({
      recipient: to,
      subject,
      email_type: type || 'unknown',
      user_id: userId || null,
      status: success ? 'sent' : 'failed',
      provider_id: id || null,
      error_message: error || null,
    });
  } catch (logErr) {
    // Logging itself should never throw up the chain
    console.error('Failed to log email:', logErr);
  }
}

/**
 * Rough plain-text extraction from HTML.
 * Used as automatic fallback when no explicit text is provided.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export { resend };
