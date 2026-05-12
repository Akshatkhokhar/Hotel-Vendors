import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { replySchema } from '@/lib/validations/inquiry';
import { sendEmail } from '@/lib/email';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

/**
 * @swagger
 * /api/inquiries/{id}:
 *   get:
 *     tags: [Inquiries]
 *     summary: Get full inquiry thread
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Full message thread
 *       403:
 *         description: Not your inquiry
 *       404:
 *         description: Inquiry not found
 */
async function handleGET(request: NextRequest, { params }: { params: { id: string } }) {

  const { id } = params;
  const auth = await requireRole('vendor', 'hotel_owner');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const supabase = await createClient();

  const { data: inquiry, error } = await supabase
    .from('vendor_inquiries')
    .select(`
      id, subject, status, guest_name, guest_email, guest_phone,
      hotel_owner_id, vendor_id, hotel_id, created_at, last_message_at, read_at,
      inquiry_messages(id, body, sender_id, attachments, created_at),
      vendors(user_id)
    `)
    .eq('id', id)
    .single();

  if (error || !inquiry) return errorResponse('Inquiry not found', null, 404);

  const isVendor = (inquiry.vendors as any)?.user_id === auth.user.id;
  const isOwner = inquiry.hotel_owner_id === auth.user.id;
  if (!isVendor && !isOwner) return errorResponse('Forbidden', null, 403);

  (inquiry.inquiry_messages as any[]).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (isVendor && inquiry.status === 'new') {
    await supabaseAdmin
      .from('vendor_inquiries')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('id', inquiry.id);
    inquiry.status = 'read';
  }

  delete (inquiry as any).vendors;
  (inquiry as any).is_vendor = isVendor;

  return successResponse(inquiry, 'Inquiry retrieved');
}

/**
 * @swagger
 * /api/inquiries/{id}:
 *   post:
 *     tags: [Inquiries]
 *     summary: Reply to inquiry
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body:
 *                 type: string
 *                 example: Thank you for your inquiry...
 *     responses:
 *       201:
 *         description: Reply sent
 *       403:
 *         description: Not your inquiry
 */
async function handlePOST(request: NextRequest, { params }: { params: { id: string } }) {

  const { id } = params;
  const auth = await requireRole('vendor', 'hotel_owner');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const body = await request.json();
  const validated = replySchema.safeParse(body);
  if (!validated.success) return errorResponse('Validation failed', validated.error.format(), 400);

  const supabase = await createClient();

  const { data: inquiry } = await supabase
    .from('vendor_inquiries')
    .select('id, subject, vendor_id, hotel_owner_id, guest_email, vendors(user_id, company_name)')
    .eq('id', id)
    .single();

  if (!inquiry) return errorResponse('Inquiry not found', null, 404);

  const isVendor = (inquiry.vendors as any)?.user_id === auth.user.id;
  const isOwner = inquiry.hotel_owner_id === auth.user.id;
  if (!isVendor && !isOwner) return errorResponse('Forbidden', null, 403);

  const { data: message, error: msgError } = await supabaseAdmin
    .from('inquiry_messages')
    .insert({
      inquiry_id: id, sender_id: auth.user.id,
      body: validated.data.body, attachments: validated.data.attachments || [],
    })
    .select('id, body, sender_id, created_at')
    .single();

  if (msgError) throw msgError;

  const updateData: any = { last_message_at: new Date().toISOString() };
  updateData.status = isVendor ? 'replied' : 'new';
  await supabaseAdmin.from('vendor_inquiries').update(updateData).eq('id', id);

  // Email notifications — fire and forget
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

  if (isVendor) {
    let ownerEmail = inquiry.guest_email;
    if (!ownerEmail && inquiry.hotel_owner_id) {
      const { data: p } = await supabaseAdmin.from('profiles').select('email').eq('id', inquiry.hotel_owner_id).single();
      ownerEmail = p?.email;
    }
    if (ownerEmail) {
      sendEmail({
        to: ownerEmail, subject: `Reply from ${(inquiry.vendors as any)?.company_name}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h2 style="color:#4F7575;">${(inquiry.vendors as any)?.company_name} replied to your inquiry</h2><div style="background:#f9fafb;padding:16px;border-radius:6px;border-left:4px solid #4F7575;"><p style="color:#555;line-height:1.6;">${validated.data.body}</p></div><p style="margin-top:24px;"><a href="${APP_URL}/dashboard/inquiries/${id}" style="background:#4F7575;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">View Full Thread</a></p><p style="color:#999;font-size:12px;margin-top:32px;">&copy; ${new Date().getFullYear()} HotelVendors.com | <a href="${APP_URL}/unsubscribe" style="color:#4F7575;">Unsubscribe</a></p></div>`,
        userId: inquiry.hotel_owner_id, type: 'inquiry_reply',
      });
    }
  }

  if (isOwner) {
    const { data: vc } = await supabaseAdmin.from('vendor_contacts').select('email').eq('vendor_id', inquiry.vendor_id).eq('is_primary', true).maybeSingle();
    if (vc?.email) {
      sendEmail({
        to: vc.email, subject: `New reply on inquiry: ${inquiry.subject}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h2 style="color:#4F7575;">New reply on your inquiry</h2><p style="color:#555;">Subject: <strong>${inquiry.subject}</strong></p><div style="background:#f9fafb;padding:16px;border-radius:6px;border-left:4px solid #4F7575;"><p style="color:#555;line-height:1.6;">${validated.data.body}</p></div><p style="margin-top:24px;"><a href="${APP_URL}/dashboard/inquiries/${id}" style="background:#4F7575;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">View &amp; Reply</a></p><p style="color:#999;font-size:12px;margin-top:32px;">&copy; ${new Date().getFullYear()} HotelVendors.com | <a href="${APP_URL}/unsubscribe" style="color:#4F7575;">Unsubscribe</a></p></div>`,
        userId: (inquiry.vendors as any)?.user_id, type: 'inquiry_reply',
      });
    }
  }

  return successResponse(message, 'Reply sent successfully', 201);
}

export const GET = withErrorHandler(handleGET, 'GET /api/inquiries/[id]');
export const POST = withErrorHandler(handlePOST, 'POST /api/inquiries/[id]');
