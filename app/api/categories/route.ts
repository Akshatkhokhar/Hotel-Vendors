import type { NextRequest } from 'next/server'
import { successResponse } from '@/lib/helpers/response';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

async function handleGET() {
  const mockCategories = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Textiles', slug: 'textiles' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Furniture', slug: 'furniture' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Amenities', slug: 'amenities' },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Lighting', slug: 'lighting' },
    { id: '55555555-5555-5555-5555-555555555555', name: 'Technology', slug: 'technology' },
    { id: '66666666-6666-6666-6666-666666666666', name: 'Housekeeping', slug: 'housekeeping' }
  ];

  const response = successResponse(
    { parent_categories: mockCategories },
    'Categories retrieved successfully'
  );

  response.headers.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800');
  return response;
}

export const GET = withErrorHandler(handleGET, 'GET /api/categories');
