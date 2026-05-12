import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

/**
 * @swagger
 * /api/dashboard/vendor:
 *   get:
 *     tags: [Dashboard - Vendor]
 *     summary: Vendor dashboard overview
 *     description: |
 *       Returns all KPIs for vendor dashboard:
 *       profile completeness, inquiry stats,
 *       view stats, recent activity, subscription.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor dashboard data
 *       403:
 *         description: Not a vendor account
 */
async function handleGET(request: NextRequest) {

  const auth = await requireRole('vendor');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const supabase = await createClient();

  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select(`
      id, slug, company_name, description, logo_url, website, status,
      average_rating, review_count, view_count, is_featured, created_at,
      vendor_locations(id), vendor_contacts(id), vendor_categories(category_id)
    `)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (vendorError) throw vendorError;

  if (!vendor) {
    return successResponse({ profileComplete: false }, 'Profile setup required');
  }

  let score = 0;
  if (vendor.company_name) score += 10;
  if (vendor.description) score += 15;
  if (vendor.logo_url) score += 15;
  if (vendor.website) score += 10;
  if (vendor.vendor_locations?.length > 0) score += 20;
  if (vendor.vendor_contacts?.length > 0) score += 15;
  if (vendor.vendor_categories?.length > 0) score += 15;
  const completeness = Math.min(score, 100);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalInquiries },
    { count: unreadInquiries },
    { count: totalReviews },
    { count: views30 },
    { count: views7 },
    { data: recentInquiries },
    { data: recentReviews },
    { data: subStatus },
    { count: totalMarketVendors },
  ] = await Promise.all([
    supabase.from('vendor_inquiries').select('id', { count: 'exact', head: true }).eq('vendor_id', vendor.id),
    supabase.from('vendor_inquiries').select('id', { count: 'exact', head: true }).eq('vendor_id', vendor.id).eq('status', 'new'),
    supabase.from('vendor_reviews').select('id', { count: 'exact', head: true }).eq('vendor_id', vendor.id),
    supabaseAdmin.from('vendor_views').select('id', { count: 'exact', head: true }).eq('vendor_id', vendor.id).gte('viewed_at', thirtyDaysAgo),
    supabaseAdmin.from('vendor_views').select('id', { count: 'exact', head: true }).eq('vendor_id', vendor.id).gte('viewed_at', sevenDaysAgo),
    supabase.from('vendor_inquiries').select('id, subject, status, created_at').eq('vendor_id', vendor.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('vendor_reviews').select('id, rating, content, created_at, profiles(first_name, last_name)').eq('vendor_id', vendor.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('vendor_subscriptions').select('plan_id, status, current_period_end').eq('vendor_id', vendor.id).eq('status', 'active').maybeSingle(),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
  ]);

  return successResponse({
    profileComplete: true, completeness,
    vendor: { id: vendor.id, company_name: vendor.company_name, slug: vendor.slug, status: vendor.status, average_rating: vendor.average_rating },
    stats: {
      inquiries: { total: totalInquiries || 0, unread: unreadInquiries || 0 },
      reviews: { total: totalReviews || 0, average: vendor.average_rating || 0 },
      views: { last30Days: views30 || 0, last7Days: views7 || 0 },
      marketTotal: totalMarketVendors || 0,
    },
    recentInquiries: recentInquiries || [],
    recentReviews: recentReviews || [],
    subscription: subStatus || null,
  }, 'Vendor dashboard data retrieved');
}

export const GET = withErrorHandler(handleGET, 'GET /api/dashboard/vendor');
