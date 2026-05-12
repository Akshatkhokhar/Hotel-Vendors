import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current logged in user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Not authenticated
 */
async function handleGET() {

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return errorResponse('Not authenticated', null, 401);
  }

  // Fetch profile from DB for additional data
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role, first_name, last_name, avatar_url, created_at')
    .eq('id', user.id)
    .maybeSingle();

  return successResponse({
    id: user.id,
    email: user.email,
    role: profile?.role || user.user_metadata?.role,
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    avatar_url: profile?.avatar_url || null,
    created_at: profile?.created_at || user.created_at,
  }, 'User retrieved successfully');
}

export const GET = withErrorHandler(handleGET, 'GET /api/auth/me');
