import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
async function handlePOST() {

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  // Return success even if token was already expired
  if (error) {
    console.warn('Logout warning (non-fatal):', error.message);
  }

  return successResponse(null, 'Logged out successfully');
}

export const POST = withErrorHandler(handlePOST, 'POST /api/auth/logout');
