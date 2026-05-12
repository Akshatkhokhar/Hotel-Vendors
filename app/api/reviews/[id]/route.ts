import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get single review detail
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Review detail
 */
async function handleGET(request: NextRequest, { params }: { params: { id: string } }) {

  const { id } = params;
  const supabase = await createClient();

  const { data: review, error } = await supabase
    .from('vendor_reviews')
    .select('id, rating, content, created_at, vendor_id, user_id, profiles(first_name, last_name, avatar_url)')
    .eq('id', id)
    .single();

  if (error || !review) return errorResponse('Review not found', null, 404);

  return successResponse(review, 'Review retrieved');
}

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     tags: [Reviews]
 *     summary: Update your review
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               title: { type: string }
 *               body: { type: string }
 *     responses:
 *       200:
 *         description: Review updated
 *       403:
 *         description: Not your review
 */
async function handlePUT(request: NextRequest, { params }: { params: { id: string } }) {

  const { id } = params;
  const auth = await requireRole('hotel_owner');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const supabase = await createClient();

  // Verify ownership
  const { data: review } = await supabase
    .from('vendor_reviews')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!review) return errorResponse('Review not found', null, 404);
  if (review.user_id !== auth.user.id) return errorResponse('Forbidden', null, 403);

  const body = await request.json();
  const { rating, content } = body;

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return errorResponse('Rating must be between 1 and 5', null, 400);
  }

  const updateData: { rating?: number; content?: string } = {};
  if (rating !== undefined) updateData.rating = rating;
  if (content !== undefined) updateData.content = content;

  const { data: updated, error } = await supabase
    .from('vendor_reviews')
    .update(updateData)
    .eq('id', id)
    .select('id, rating, content, created_at')
    .single();

  if (error) throw error;

  return successResponse(updated, 'Review updated successfully');
}

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete your review
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Review deleted
 *       403:
 *         description: Not your review
 */
async function handleDELETE(request: NextRequest, { params }: { params: { id: string } }) {

  const { id } = params;
  const auth = await requireRole('hotel_owner');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const supabase = await createClient();

  // Verify ownership
  const { data: review } = await supabase
    .from('vendor_reviews')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!review) return errorResponse('Review not found', null, 404);
  if (review.user_id !== auth.user.id) return errorResponse('Forbidden', null, 403);

  const { error } = await supabase.from('vendor_reviews').delete().eq('id', id);
  if (error) throw error;

  return successResponse(null, 'Review deleted successfully');
}

export const GET = withErrorHandler(handleGET, 'GET /api/reviews/[id]');
export const PUT = withErrorHandler(handlePUT, 'PUT /api/reviews/[id]');
export const DELETE = withErrorHandler(handleDELETE, 'DELETE /api/reviews/[id]');
