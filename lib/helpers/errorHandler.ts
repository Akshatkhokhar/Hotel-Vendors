import { errorResponse } from '@/lib/helpers/response';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Wraps a route handler with:
 *  - try/catch error boundary
 *  - X-Request-ID header
 *  - Production-safe error messages
 *
 * @param {Function} handler   - The async route handler (request, context) => Response
 * @param {string}   routeName - Human-readable name for logging, e.g. "GET /api/vendors"
 * @returns {Function}
 */
import type { NextRequest, NextResponse } from 'next/server';

export function withErrorHandler(handler: (request: NextRequest, context: any) => Promise<NextResponse>, routeName: string) {
  return async function wrappedHandler(request: NextRequest, context: any) {
    const requestId = crypto.randomUUID();

    try {
      const response = await handler(request, context);

      // Attach request ID to every response
      response.headers.set('X-Request-ID', requestId);

      return response;
    } catch (err: any) {
      console.error(`[${routeName}] [${requestId}] Unhandled error:`, err);

      const message = isDev
        ? err.message
        : 'Internal Server Error';
      const errorDetail = isDev ? err.stack : null;

      const response = errorResponse(message, errorDetail, 500);
      response.headers.set('X-Request-ID', requestId);

      return response;
    }
  };
}
