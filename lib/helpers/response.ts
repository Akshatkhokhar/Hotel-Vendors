import { NextResponse } from 'next/server'
import type { PaginationMeta } from '@/types'

export function successResponse<T = unknown>(data: T, message: string = 'Success', status: number = 200): NextResponse {
  return NextResponse.json(
    { success: true, data, message },
    { status }
  )
}

export function errorResponse(message: string = 'An error occurred', error: unknown = null, status: number = 400): NextResponse {
  return NextResponse.json(
    { success: false, message, error },
    { status }
  )
}

export function paginatedResponse<T = unknown>(data: T[], pagination: PaginationMeta, message: string = 'Success', status: number = 200): NextResponse {
  return NextResponse.json(
    { success: true, data, pagination, message },
    { status }
  )
}
