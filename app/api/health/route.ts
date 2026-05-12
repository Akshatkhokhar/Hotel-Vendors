import type { NextRequest } from 'next/server'
/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Check server health
 *     description: Returns server status and database connection
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 *                   example: connected
 *                 environment:
 *                   type: string
 *                   example: development
 */
import { supabaseAdmin } from '@/lib/supabase/admin';

import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const timestamp = new Date().toISOString();
  let dbStatus = 'disconnected';

  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    // Even a "no rows" result means the connection works
    dbStatus = error && error.code !== 'PGRST116' ? 'error' : 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  const healthy = dbStatus === 'connected';

  const response = NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      timestamp,
      database: dbStatus,
      environment: process.env.NODE_ENV,
    },
    { status: healthy ? 200 : 503 }
  );

  // No caching on health checks
  response.headers.set('Cache-Control', 'no-store');

  return response;
}
