import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { createInquirySchema } from '@/lib/validations/inquiry';
import { getCurrentUser } from '@/lib/helpers/auth';
import { sendEmail } from '@/lib/email';
import { inquiryReceivedTemplate } from '@/lib/email/templates/inquiry-received';
import { inquirySentTemplate } from '@/lib/email/templates/inquiry-sent';
import { withErrorHandler } from '@/lib/helpers/errorHandler';
import { checkRateLimit, getRequestIP } from '@/lib/helpers/rateLimit';

/**
 * @swagger
 * /api/vendors/{slug}/contact:
 *   post:
 *     tags: [Inquiries]
 *     summary: Send inquiry to vendor
 *     description: |
 *       Send a contact inquiry to a vendor.
 *       No login required — guests can inquire.
 *       If not logged in, guest_name and guest_email required.
 *       Rate limited to 3 inquiries per hour per IP.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         example: adp-inc
 *     security:
 *       - BearerAuth: []
 *       - {}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInquiryRequest'
 *     responses:
 *       201:
 *         description: Inquiry sent successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Vendor not found
 *       429:
 *         description: Rate limit exceeded
 */
async function handlePOST(request: NextRequest, { params }: { params: { slug: string } }) {

  const { slug } = params;

  // Rate limit: 3 inquiries per hour per IP
  const ip = getRequestIP(request);
  const rl = checkRateLimit(`contact:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    const resp = errorResponse('Rate limit exceeded. Try again later.', null, 429);
    resp.headers.set('Retry-After', String(Math.ceil((rl.retryAfterMs || 0) / 1000)));
    return resp;
  }

  const body = await request.json();
  const validated = createInquirySchema.safeParse(body);
  if (!validated.success) return errorResponse('Validation failed', validated.error.format(), 400);

  const { vendor_id, subject, message, hotel_id, guest_name, guest_email, guest_phone } = validated.data;
  const user = await getCurrentUser();

  if (!user && (!guest_name || !guest_email)) {
    return errorResponse('Guest name and email are required if not logged in', null, 400);
  }

  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, user_id, company_name')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single();

  if (!vendor) return errorResponse('Vendor not found', null, 404);
  if (user && user.id === vendor.user_id) return errorResponse('Cannot contact yourself', null, 400);

  const senderName = user ? (user.user_metadata?.full_name || 'Hotel Owner') : guest_name;
  const senderEmail = user ? user.email : guest_email;

  if (!senderEmail) return errorResponse('Sender email is required', null, 400);

  const { data: inquiry, error: inquiryError } = await supabaseAdmin
    .from('vendor_inquiries')
    .insert({
      vendor_id: vendor.id,
      hotel_owner_id: user?.id || null,
      guest_name: user ? null : guest_name,
      guest_email: user ? null : guest_email,
      guest_phone: user ? null : guest_phone,
      hotel_id: hotel_id || null,
      subject,
      status: 'new',
    })
    .select('id')
    .single();

  if (inquiryError) throw inquiryError;

  await supabaseAdmin.from('inquiry_messages').insert({
    inquiry_id: inquiry.id,
    sender_id: user?.id || null,
    body: message,
  });

  // Emails — fire and forget
  const { data: vendorContact } = await supabaseAdmin
    .from('vendor_contacts')
    .select('email, phone')
    .eq('vendor_id', vendor.id)
    .eq('is_primary', true)
    .maybeSingle();

  if (vendorContact?.email) {
    sendEmail({
      to: vendorContact.email,
      subject: `New Inquiry: ${subject}`,
      html: inquiryReceivedTemplate({
        vendorName: vendor.company_name, senderName: senderName as string, senderEmail: senderEmail as string, subject,
        messagePreview: message.slice(0, 200), inquiryId: inquiry.id,
      }),
      userId: vendor.user_id, type: 'inquiry_received',
    });
  }

  sendEmail({
    to: senderEmail,
    subject: `Inquiry Sent: ${vendor.company_name}`,
    html: inquirySentTemplate({
      vendorName: vendor.company_name, vendorPhone: vendorContact?.phone || '',
      vendorEmail: vendorContact?.email || '', subject,
    }),
    userId: user?.id, type: 'inquiry_sent',
  });

  return successResponse({ inquiry_id: inquiry.id }, 'Inquiry sent successfully', 201);
}

export const POST = withErrorHandler(handlePOST, 'POST /api/vendors/[slug]/contact');
