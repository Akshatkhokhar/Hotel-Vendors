import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { withErrorHandler } from '@/lib/helpers/errorHandler';
import { checkRateLimit, getRequestIP } from '@/lib/helpers/rateLimit';
import { sendEmail } from '@/lib/email';
import { inquiryTemplate } from '@/lib/email/templates/inquiry';

async function handlePOST(request: NextRequest) {
  // Authentication check
  const auth = await requireRole('hotel_owner');
  if (!auth.authorized || !auth.user) {
    return errorResponse(auth.error || 'Only logged in hotel owners can send inquiries.', null, auth.status);
  }

  // Rate limit: 5 inquiries per hour per user
  const rl = checkRateLimit(`inquiry:${auth.user.id}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    const resp = errorResponse('Too many inquiries sent. Please wait an hour.', null, 429);
    resp.headers.set('Retry-After', String(Math.ceil((rl.retryAfterMs || 0) / 1000)));
    return resp;
  }

  const { vendor_id, message } = await request.json();

  if (!vendor_id || !message) {
    return errorResponse('vendor_id and message are required', null, 400);
  }

  // Fetch vendor details (specifically the email)
  const { data: vendor, error: vendorError } = await supabaseAdmin
    .from('vendors')
    .select(`
      company_name,
      vendor_contacts(email, is_primary)
    `)
    .eq('id', vendor_id)
    .maybeSingle();

  if (vendorError || !vendor) {
    return errorResponse('Vendor not found', null, 404);
  }

  const primaryContact = (vendor.vendor_contacts as any[])?.find(c => c.is_primary) || (vendor.vendor_contacts as any[])?.[0];
  const vendorEmail = primaryContact?.email;

  if (!vendorEmail) {
    return errorResponse('This vendor has no registered email to receive inquiries.', null, 400);
  }

  // Send the email
  const emailResult = await sendEmail({
    to: vendorEmail,
    subject: `New Marketplace Inquiry from ${auth.user.user_metadata?.full_name || auth.user.email}`,
    html: inquiryTemplate({
      vendorName: vendor.company_name,
      senderName: auth.user.user_metadata?.full_name || 'A Property Owner',
      senderEmail: auth.user.email!,
      message: message
    }),
    userId: auth.user.id,
    type: 'vendor_inquiry'
  });

  if (!emailResult.success) {
    return errorResponse('Failed to send inquiry email. Please try again later.', emailResult.error, 500);
  }

  return successResponse(null, 'Inquiry sent successfully');
}

export const POST = withErrorHandler(handlePOST, 'POST /api/inquiry');
