import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

/**
 * @swagger
 * /api/inquiries:
 *   get:
 *     tags: [Inquiries]
 *     summary: Get vendor inbox (vendor only)
 *     description: |
 *       Returns all inquiries received by the 
 *       logged in vendor. Includes unread count.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, read, replied, closed]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Vendor inquiry inbox
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not a vendor account
 */
async function handleGET(request: NextRequest) {

  const auth = await requireRole('vendor');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1') || 1;
  const limit = parseInt(searchParams.get('limit') || '10') || 10;
  const status = searchParams.get('status');
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (!vendor) {
    return paginatedResponse([], {
      total: 0, page, limit, totalPages: 1,
      hasNext: false, hasPrev: false,
    }, 'No vendor profile found, returning empty inbox');
  }

  let query: any = supabase
    .from('vendor_inquiries')
    .select(`
      id, subject, status, guest_name, guest_email,
      hotel_owner_id, created_at, last_message_at, read_at,
      inquiry_messages(id, body, created_at, sender_id)
    `, { count: 'exact' })
    .eq('vendor_id', vendor.id);

  if (status) query = query.eq('status', status);

  query = query
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  const formattedData = (data as any[]).map(inq => {
    const messages = (inq.inquiry_messages || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return {
      id: inq.id, subject: inq.subject, status: inq.status,
      guest_name: inq.guest_name, guest_email: inq.guest_email,
      hotel_owner_id: inq.hotel_owner_id, created_at: inq.created_at,
      last_message_at: inq.last_message_at, read_at: inq.read_at,
      latest_message: messages[0] || null,
      unread: inq.status === 'new',
    };
  });

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  return paginatedResponse(formattedData, {
    total: totalCount, page, limit, totalPages,
    hasNext: page < totalPages, hasPrev: page > 1,
  }, 'Inquiries retrieved');
}

export const GET = withErrorHandler(handleGET, 'GET /api/inquiries');
