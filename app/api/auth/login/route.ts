import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { loginSchema } from '@/lib/validations/auth';
import { withErrorHandler } from '@/lib/helpers/errorHandler';
import { checkRateLimit, getRequestIP } from '@/lib/helpers/rateLimit';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login to your account
 *     description: |
 *       Returns access_token and refresh_token.
 *       Use the access_token as Bearer token 
 *       in the Authorization header for protected routes.
 *       Click the Authorize button at the top 
 *       and enter: Bearer YOUR_ACCESS_TOKEN
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 */
async function handlePOST(request: NextRequest) {

  // Rate limit: 10 login attempts per 15 minutes per IP
  const ip = getRequestIP(request);
  const rl = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    const resp = errorResponse('Too many login attempts. Try again later.', null, 429);
    resp.headers.set('Retry-After', String(Math.ceil((rl.retryAfterMs || 0) / 1000)));
    return resp;
  }

  const body = await request.json();
  const validated = loginSchema.safeParse(body);
  if (!validated.success) return errorResponse('Validation failed', validated.error.format(), 400);

  const { email, password, captchaToken } = validated.data;

  // Turnstile Verification
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: turnstileSecret,
      response: captchaToken,
      remoteip: ip
    })
  });

  const verifyData = await verifyRes.json();
  if (!verifyData.success) {
    return errorResponse('Captcha verification failed. Please try again.', null, 400);
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // Same error message for wrong email AND wrong password to prevent enumeration
  if (error) {
    return errorResponse('Invalid email or password', null, 401);
  }

  const user = data.user;
  const role = user.user_metadata?.role || 'vendor';

  return successResponse({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    user: {
      id: user.id,
      email: user.email,
      role,
      full_name: user.user_metadata?.full_name || '',
    },
  }, 'Login successful');
}

export const POST = withErrorHandler(handlePOST, 'POST /api/auth/login');
