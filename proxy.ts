import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const MAX_BODY_SIZE = 50 * 1024; // 50 KB

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { pathname } = request.nextUrl;
  const method = request.method;

  // ── Content-Type validation for mutation requests ──
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const contentType = request.headers.get('content-type') || '';

    // Allow multipart for file uploads
    const isUpload = pathname.startsWith('/api/uploads') || pathname === '/api/dashboard/vendor/logo';
    const isJson = contentType.includes('application/json');
    const isMultipart = contentType.includes('multipart/form-data');

    if (!isUpload && !isJson) {
      return jsonError('Content-Type must be application/json', 415, requestId);
    }

    if (isUpload && !isMultipart && !isJson) {
      return jsonError('Content-Type must be multipart/form-data or application/json', 415, requestId);
    }

    // ── Body size check (skip for multipart — files are validated in the route) ──
    if (!isMultipart) {
      const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
      if (contentLength > MAX_BODY_SIZE) {
        return jsonError('Request body too large. Maximum 50 KB.', 413, requestId);
      }
    }
  }

  // ── Supabase session refresh ──
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.');
    // If we're missing keys, we can't refresh sessions, but we can still apply headers
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      supabaseResponse.headers.set(key, value);
    }
    supabaseResponse.headers.set('X-Request-ID', requestId);
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Protected route checks ──
  const isDashboardRoute = pathname.startsWith('/api/dashboard');
  const isInquiriesRoute = pathname.startsWith('/api/inquiries');
  const isReviewsPost = pathname.startsWith('/api/reviews') && method === 'POST';
  const isUploadsPost = pathname.startsWith('/api/uploads') && method === 'POST';

  if ((isDashboardRoute || isInquiriesRoute || isReviewsPost || isUploadsPost) && !user) {
    return jsonError('Authentication required', 401, requestId);
  }

  // ── Apply security headers + request ID to every response ──
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    supabaseResponse.headers.set(key, value);
  }
  supabaseResponse.headers.set('X-Request-ID', requestId);

  return supabaseResponse;
}

// ── Helper to build a JSON error response with headers ──
function jsonError(message: string, status: number, requestId: string): NextResponse {
  const body = { success: false, message, error: message };
  const response = NextResponse.json(body, { status });

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set('X-Request-ID', requestId);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
