import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

/**
 * @swagger
 * /api/dashboard/hotel-owner:
 *   get:
 *     tags: [Dashboard - Hotel Owner]
 *     summary: Hotel owner dashboard overview
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Hotel owner dashboard data
 *       403:
 *         description: Not a hotel_owner account
 */
async function handleGET() {

  const auth = await requireRole('hotel_owner');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const supabase = await createClient();

  const [
    { data: profile },
    { data: hotels },
    { data: inquiries },
    { data: savedVendors },
  ] = await Promise.all([
    supabase.from('hotel_owners').select('id, user_id, created_at').eq('user_id', auth.user.id).maybeSingle(),
    supabase.from('hotels').select('id, name, hotel_type, room_count, city, state, created_at').eq('owner_id', auth.user.id),
    supabase.from('vendor_inquiries').select('id, subject, status, created_at, vendors(company_name, logo_url)').eq('hotel_owner_id', auth.user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('saved_vendors').select('id, created_at, vendors(id, company_name, slug, logo_url)').eq('hotel_owner_id', auth.user.id).limit(5),
  ]);

  return successResponse({
    profile: profile || null,
    hotels: hotels || [],
    recentInquiries: inquiries || [],
    savedVendors: savedVendors || [],
    stats: { totalHotels: hotels?.length || 0, totalSaved: savedVendors?.length || 0 },
  }, 'Hotel owner dashboard data retrieved');
}

export const GET = withErrorHandler(handleGET, 'GET /api/dashboard/hotel-owner');
