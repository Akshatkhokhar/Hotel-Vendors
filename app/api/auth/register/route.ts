import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { registerSchema } from '@/lib/validations/auth';
import { withErrorHandler } from '@/lib/helpers/errorHandler';
import { checkRateLimit, getRequestIP } from '@/lib/helpers/rateLimit';
import { sendEmail } from '@/lib/email';
import { welcomeTemplate } from '@/lib/email/templates/welcome';

// Helper function to generate unique vendor slug
async function generateUniqueVendorSlug(companyName: string): Promise<string> {
  const slugify = (await import('slugify')).default;
  const base = slugify(companyName, { lower: true, strict: true, trim: true });
  let slug = base;
  let counter = 1;

  while (true) {
    const { data } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (!data) return slug;
    counter++;
    slug = `${base}-${counter}`;
  }
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: |
 *       Creates a new hotel_owner or vendor account.
 *       Admin accounts cannot be self-registered.
 *       A verification email is sent automatically.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many registration attempts
 */
async function handlePOST(request: NextRequest) {

  // Rate limit: 5 registrations per hour per IP
  const ip = getRequestIP(request);
  const rl = checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    const resp = errorResponse('Too many registration attempts. Try again later.', null, 429);
    resp.headers.set('Retry-After', String(Math.ceil((rl.retryAfterMs || 0) / 1000)));
    return resp;
  }

  const body = await request.json();
  const validated = registerSchema.safeParse(body);
  if (!validated.success) return errorResponse('Validation failed', validated.error.format(), 400);

  const { email, password, role, full_name, description, captchaToken } = validated.data;

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

  // registerSchema already restricts role to 'vendor' | 'hotel_owner'
  // but explicit guard against admin role in case schema is ever loosened
  if ((role as string) === 'admin') {
    return errorResponse('Cannot register as admin', null, 403);
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { 
      role, 
      full_name: full_name || '',
    }
  });

  if (error) {
    if (error.message.includes('already been registered') || error.status === 422) {
      return errorResponse('An account with this email already exists', null, 409);
    }
    throw error;
  }

  if (!data.user) {
    return errorResponse('Failed to create user', null, 500);
  }

  // Create profile row
  await supabaseAdmin.from('profiles').insert({
    id: data.user.id,
    email,
    role,
  });

  // If vendor, create vendor record with description
  if (role === 'vendor' && (full_name || description)) {
    const { generateSlug } = await import('@/lib/helpers/slug');
    const slug = await generateUniqueVendorSlug(full_name || email.split('@')[0]);
    
    await supabaseAdmin.from('vendors').insert({
      id: data.user.id,
      company_name: full_name || email.split('@')[0],
      slug,
      description: description || '',
      status: 'pending',
      source: 'self_signup',
      is_featured: false,
    });
  }

  // Send welcome email (fire and forget)
  sendEmail({
    to: email,
    subject: 'Welcome to HotelVendors.com!',
    html: welcomeTemplate({ name: email.split('@')[0], role }),
    userId: data.user.id,
    type: 'welcome',
  });

  return successResponse(
    { id: data.user.id, email: data.user.email, role },
    'Account created successfully',
    201
  );
}

export const POST = withErrorHandler(handlePOST, 'POST /api/auth/register');
