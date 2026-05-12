import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

/**
 * @swagger
 * /api/reviews/{id}/respond:
 *   post:
 *     tags: [Reviews]
 *     summary: Vendor responds to a review
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
 *             required: [response_text]
 *             properties:
 *               response_text:
 *                 type: string
 *                 example: Thank you for your feedback...
 *     responses:
 *       201:
 *         description: Response posted
 *       403:
 *         description: Not your vendor review
 */
async function handlePOST(request: NextRequest, { params }: { params: { id: string } }) {

  const { id } = params;
  const auth = await requireRole('vendor');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const body = await request.json();
  const { response_text } = body;

  if (!response_text || response_text.trim().length === 0) {
    return errorResponse('Response text is required', null, 400);
  }

  if (response_text.length > 2000) {
    return errorResponse('Response must be 2000 characters or less', null, 400);
  }

  const supabase = await createClient();

  // Verify the review exists and belongs to this vendor's listing
  const { data: review } = await supabase
    .from('vendor_reviews')
    .select('id, vendor_id, vendors(user_id)')
    .eq('id', id)
    .single();

  if (!review) return errorResponse('Review not found', null, 404);

  // Verify the authenticated vendor owns this vendor listing
  if ((review.vendors as any)?.user_id !== auth.user.id) {
    return errorResponse('Forbidden — this review is not on your listing', null, 403);
  }

  // Check if a response already exists
  const { data: existingResponse } = await supabase
    .from('vendor_review_responses')
    .select('id')
    .eq('review_id', id)
    .maybeSingle();

  if (existingResponse) {
    return errorResponse('You have already responded to this review', null, 400);
  }

  const { data: reviewResponse, error } = await supabase
    .from('vendor_review_responses')
    .insert({
      review_id: id,
      vendor_id: review.vendor_id,
      response_text: response_text.trim(),
    })
    .select('id, response_text, created_at')
    .single();

  if (error) throw error;

  return successResponse(reviewResponse, 'Review response submitted', 201);
}

export const POST = withErrorHandler(handlePOST, 'POST /api/reviews/[id]/respond');
