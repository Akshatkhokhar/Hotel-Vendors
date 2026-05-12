import type { NextRequest } from 'next/server'
import { getApiDocs } from '@/lib/swagger'

export async function GET(): Promise<Response> {
  const spec = getApiDocs()
  return Response.json(spec)
}
