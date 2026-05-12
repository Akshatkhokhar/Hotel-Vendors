import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { createHotelSchema } from '@/lib/validations/hotel';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

/**
 * @swagger
 * /api/dashboard/hotel-owner/hotels:
 *   get:
 *     tags: [Dashboard - Hotel Owner]
 *     summary: List all hotels for this owner
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Hotel list
 */
async function handleGET() {

  const auth = await requireRole('hotel_owner');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('hotels')
    .select('id, name, hotel_type, room_count, address, city, state, postal_code, created_at')
    .eq('owner_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return successResponse(data, 'Hotels retrieved successfully');
}

/**
 * @swagger
 * /api/dashboard/hotel-owner/hotels:
 *   post:
 *     tags: [Dashboard - Hotel Owner]
 *     summary: Add a new hotel property
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, hotel_type]
 *             properties:
 *               name: { type: string, example: Atlanta Grand Hotel }
 *               hotel_type:
 *                 type: string
 *                 enum: [hotel, motel, resort, b_and_b, boutique, extended_stay, other]
 *               room_count: { type: integer, example: 120 }
 *               city: { type: string }
 *               state: { type: string }
 *     responses:
 *       201:
 *         description: Hotel added
 */
async function handlePOST(request: NextRequest) {

  const auth = await requireRole('hotel_owner');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const body = await request.json();
  const validated = createHotelSchema.safeParse(body);
  if (!validated.success) return errorResponse('Validation failed', validated.error.format(), 400);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('hotels')
    .insert({ ...validated.data, owner_id: auth.user.id })
    .select('id, name, hotel_type, room_count, city, state, created_at')
    .single();

  if (error) throw error;
  return successResponse(data, 'Hotel created successfully', 201);
}

export const GET = withErrorHandler(handleGET, 'GET /api/dashboard/hotel-owner/hotels');
export const POST = withErrorHandler(handlePOST, 'POST /api/dashboard/hotel-owner/hotels');
