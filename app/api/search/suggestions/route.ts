import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     tags: [Search]
 *     summary: Autocomplete vendor name suggestions
 *     description: Returns up to 5 vendor name matches for autocomplete
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string, minLength: 2 }
 *         example: adp
 *     responses:
 *       200:
 *         description: List of matching vendor suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       slug: { type: string }
 *                       company_name: { type: string }
 *                       logo_url: { type: string }
 */
async function handleGET(request: NextRequest) {

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return errorResponse('Search query must be at least 2 characters long', null, 400);
  }

  const { data, error } = await supabaseAdmin
    .from('vendors')
    .select('id, slug, company_name, logo_url')
    .eq('status', 'approved')
    .ilike('company_name', `%${q}%`)
    .limit(5);

  if (error) return errorResponse('Failed to fetch suggestions', null, 500);

  const response = successResponse(data, 'Suggestions retrieved successfully');

  // Cache for 1 minute
  response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
  return response;
}

export const GET = withErrorHandler(handleGET, 'GET /api/search/suggestions');
