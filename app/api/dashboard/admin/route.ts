import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

/**
 * @swagger
 * /api/dashboard/admin:
 *   get:
 *     tags: [Dashboard - Admin]
 *     summary: Admin platform overview
 *     description: |
 *       Full platform stats:
 *       vendor counts, user counts, 
 *       inquiry/review totals, recent signups.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard stats
 *       403:
 *         description: Not an admin account
 */
async function handleGET() {

  const auth = await requireRole('admin');
  if (!auth.authorized) return errorResponse(auth.error, null, auth.status);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekStr = lastWeek.toISOString();

  const [
    { count: approvedVendors },
    { count: pendingVendors },
    { count: totalUsers },
    { count: inquiriesToday },
    { count: inquiriesThisWeek },
    { count: totalReviews },
    { count: newSignups },
    { data: topVendors },
  ] = await Promise.all([
    supabaseAdmin.from('vendors').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabaseAdmin.from('vendors').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('vendor_inquiries').select('id', { count: 'exact', head: true }).gte('created_at', todayStr),
    supabaseAdmin.from('vendor_inquiries').select('id', { count: 'exact', head: true }).gte('created_at', lastWeekStr),
    supabaseAdmin.from('vendor_reviews').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', lastWeekStr),
    supabaseAdmin.from('vendors').select('id, company_name, view_count, logo_url').order('view_count', { ascending: false }).limit(5),
  ]);

  return successResponse({
    vendors: { approved: approvedVendors || 0, pending: pendingVendors || 0, total: (approvedVendors || 0) + (pendingVendors || 0) },
    users: { total: totalUsers || 0, newLast7Days: newSignups || 0 },
    activity: { inquiriesToday: inquiriesToday || 0, inquiriesThisWeek: inquiriesThisWeek || 0, totalReviews: totalReviews || 0 },
    topVendors: topVendors || [],
  }, 'Admin dashboard data retrieved');
}

export const GET = withErrorHandler(handleGET, 'GET /api/dashboard/admin');
