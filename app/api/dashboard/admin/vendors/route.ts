import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

/**
 * @swagger
 * /api/dashboard/admin/vendors:
 *   get:
 *     tags: [Dashboard - Admin]
 *     summary: All vendors for admin management
 *     description: Returns all vendors including pending/rejected
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, suspended]
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [scraped, manual, self_signup]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Full vendor list with management data
 *       403:
 *         description: Not an admin account
 */
async function handleGET(request: NextRequest) {

  const auth = await requireRole('admin');
  if (!auth.authorized) return errorResponse(auth.error, null, auth.status);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1') || 1;
  const limit = parseInt(searchParams.get('limit') || '20') || 20;
  const status = searchParams.get('status');
  const source = searchParams.get('source');
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('vendors')
    .select(`
      id, slug, company_name, logo_url, status, source,
      is_featured, average_rating, view_count, created_at,
      profiles(email)
    `, { count: 'exact' });

  if (status) query = query.eq('status', status);
  if (source) query = query.eq('source', source);

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  return paginatedResponse(data, {
    total: totalCount, page, limit, totalPages,
    hasNext: page < totalPages, hasPrev: page > 1,
  }, 'Admin vendors list retrieved');
}

export const GET = withErrorHandler(handleGET, 'GET /api/dashboard/admin/vendors');
