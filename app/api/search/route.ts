import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/helpers/response';
import { searchQuerySchema } from '@/lib/validations/search';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

/**
 * @swagger
 * /api/search:
 *   get:
 *     tags: [Search]
 *     summary: Search vendors with filters
 *     description: |
 *       Full text search + filter system.
 *       Uses PostgreSQL search_vector for fast results.
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         example: coffee supply Atlanta
 *         description: Full text search query
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         example: coffee-beverages
 *       - in: query
 *         name: state
 *         schema: { type: string }
 *         example: Georgia
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *         example: Atlanta
 *       - in: query
 *         name: rating
 *         schema: { type: integer, minimum: 1, maximum: 5 }
 *       - in: query
 *         name: featured
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, rating, popular]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
async function handleGET(request: NextRequest) {

  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());

  const validated = searchQuerySchema.safeParse(queryParams);
  if (!validated.success) return errorResponse('Invalid query parameters', validated.error.format(), 400);

  const { q, category, state, city, rating, featured, sortBy, page, limit } = validated.data;
  const offset = (page - 1) * limit;

  let selectQuery = `
    id, slug, company_name, tagline,
    logo_url, is_featured,
    average_rating, review_count, view_count,
    vendor_locations!inner(city, state),
    vendor_contacts(contact_name, phone, is_primary)
  `;

  selectQuery += category
    ? `, vendor_categories!inner(categories!inner(name, slug))`
    : `, vendor_categories(categories(name, slug))`;

  let query: any = supabaseAdmin
    .from('vendors')
    .select(selectQuery, { count: 'exact' })
    .eq('status', 'approved');

  if (q) query = query.textSearch('search_vector', q, { type: 'websearch', config: 'english' });
  if (category) query = query.eq('vendor_categories.categories.slug', category);
  if (state) query = query.eq('vendor_locations.state', state);
  if (city) query = query.ilike('vendor_locations.city', `%${city}%`);
  if (rating) query = query.gte('average_rating', rating);
  if (featured !== undefined) query = query.eq('is_featured', featured);

  if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
  else if (sortBy === 'rating') query = query.order('average_rating', { ascending: false });
  else if (sortBy === 'popular') query = query.order('view_count', { ascending: false });

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) return errorResponse('Failed to execute search', null, 500);

  const formattedData = (data as any[]).map(v => ({
    id: v.id, slug: v.slug, company_name: v.company_name, tagline: v.tagline,
    logo_url: v.logo_url, is_featured: v.is_featured,
    average_rating: v.average_rating, review_count: v.review_count, view_count: v.view_count,
    city: v.vendor_locations?.[0]?.city, state: v.vendor_locations?.[0]?.state,
    contact_name: v.vendor_contacts?.[0]?.contact_name,
    phone: v.vendor_contacts?.[0]?.phone,
    categories: v.vendor_categories?.map((vc: any) => vc.categories) || [],
  }));

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  return paginatedResponse(formattedData, {
    total: totalCount, page, limit, totalPages,
    hasNext: page < totalPages, hasPrev: page > 1,
  }, 'Search results retrieved successfully');
}

export const GET = withErrorHandler(handleGET, 'GET /api/search');
