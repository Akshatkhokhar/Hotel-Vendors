import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { reviewSchema } from '@/lib/validations/review';
import { withErrorHandler } from '@/lib/helpers/errorHandler';
import { checkRateLimit } from '@/lib/helpers/rateLimit';

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews for a vendor
 *     parameters:
 *       - in: query
 *         name: vendor_id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Reviews list with rating breakdown
 */
async function handleGET(request: NextRequest) {

  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get('vendor_id');
  const page = parseInt(searchParams.get('page') || '1') || 1;
  const limit = parseInt(searchParams.get('limit') || '10') || 10;
  const offset = (page - 1) * limit;

  if (!vendorId) return errorResponse('vendor_id query parameter is required', null, 400);

  const supabase = await createClient();

  // Fetch reviews first
  const { data: reviews, count, error } = await supabase
    .from('vendor_reviews')
    .select('id, rating, content, created_at, user_id', { count: 'exact' })
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  let reviewsWithProfiles = reviews || [];

  if (reviews && reviews.length > 0) {
    const userIds = Array.from(new Set(reviews.map(r => r.user_id)));
    
    // Fetch profiles for these users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', userIds);

    const profileMap = (profiles || []).reduce((acc: any, p: any) => {
      acc[p.id] = p;
      return acc;
    }, {});

    reviewsWithProfiles = reviews.map(r => ({
      ...r,
      profiles: profileMap[r.user_id] || null
    }));
  }

  // Rating breakdown
  const { data: allRatings } = await supabase
    .from('vendor_reviews')
    .select('rating')
    .eq('vendor_id', vendorId);

  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  (allRatings || []).forEach((r: any) => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return paginatedResponse(
    { reviews: reviewsWithProfiles, rating_breakdown: breakdown } as any,
    { total: totalCount, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    'Reviews retrieved successfully'
  );
}

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Write a review (hotel_owner only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewRequest'
 *     responses:
 *       201:
 *         description: Review created
 *       400:
 *         description: Already reviewed this vendor
 *       403:
 *         description: Only hotel owners can write reviews
 */
async function handlePOST(request: NextRequest) {

  const auth = await requireRole('hotel_owner');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  // Rate limit: 10 reviews per day per user
  const rl = checkRateLimit(`review:${auth.user.id}`, 10, 24 * 60 * 60 * 1000);
  if (!rl.allowed) {
    const resp = errorResponse('Review limit reached. Try again tomorrow.', null, 429);
    resp.headers.set('Retry-After', String(Math.ceil((rl.retryAfterMs || 0) / 1000)));
    return resp;
  }

  const body = await request.json();
  const validated = reviewSchema.safeParse(body);
  if (!validated.success) return errorResponse('Validation failed', validated.error.format(), 400);

  const { rating, content, vendor_id } = validated.data;
  const supabase = await createClient();

  // Prevent duplicate review
  const { data: existing } = await supabase
    .from('vendor_reviews')
    .select('id')
    .eq('vendor_id', vendor_id)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (existing) return errorResponse('You have already reviewed this vendor', null, 400);

  const { data: review, error } = await supabase
    .from('vendor_reviews')
    .insert({ vendor_id, user_id: auth.user.id, rating, content })
    .select('id, rating, content, created_at')
    .single();

  if (error) throw error;

  // DB trigger should auto-update vendor average_rating and review_count

  return successResponse(review, 'Review submitted successfully', 201);
}

export const GET = withErrorHandler(handleGET, 'GET /api/reviews');
export const POST = withErrorHandler(handlePOST, 'POST /api/reviews');
