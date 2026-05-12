import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

/**
 * @swagger
 * /api/dashboard/hotel-owner/saved:
 *   get:
 *     tags: [Dashboard - Hotel Owner]
 *     summary: Get saved vendors list
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Saved vendors
 */
async function handleGET() {

  const auth = await requireRole('hotel_owner');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('saved_vendors')
    .select(`
      id, created_at,
      vendors(
        id, slug, company_name, logo_url, average_rating,
        vendor_locations(city, state),
        vendor_categories(categories(name))
      )
    `)
    .eq('hotel_owner_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const formatted = (data as any[]).map(item => ({
    id: item.vendors.id, slug: item.vendors.slug,
    company_name: item.vendors.company_name, logo_url: item.vendors.logo_url,
    average_rating: item.vendors.average_rating, saved_at: item.created_at,
    city: item.vendors.vendor_locations?.[0]?.city,
    state: item.vendors.vendor_locations?.[0]?.state,
    categories: item.vendors.vendor_categories?.map((vc: any) => vc.categories) || [],
  }));

  return successResponse(formatted, 'Saved vendors retrieved');
}

/**
 * @swagger
 * /api/dashboard/hotel-owner/saved:
 *   post:
 *     tags: [Dashboard - Hotel Owner]
 *     summary: Save a vendor
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vendor_id]
 *             properties:
 *               vendor_id: { type: string, format: uuid }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Vendor saved
 *       400:
 *         description: Already saved
 */
async function handlePOST(request: NextRequest) {

  const auth = await requireRole('hotel_owner');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const { vendor_id } = await request.json();
  if (!vendor_id) return errorResponse('vendor_id is required', null, 400);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('saved_vendors')
    .insert({ hotel_owner_id: auth.user.id, vendor_id })
    .select('id, vendor_id, created_at')
    .single();

  if (error) {
    if (error.code === '23505') return errorResponse('Vendor already saved', null, 400);
    throw error;
  }
  return successResponse(data, 'Vendor saved successfully', 201);
}

/**
 * @swagger
 * /api/dashboard/hotel-owner/saved:
 *   delete:
 *     tags: [Dashboard - Hotel Owner]
 *     summary: Remove a saved vendor
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vendor_id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Vendor removed from saved list
 */
async function handleDELETE(request: NextRequest) {

  const auth = await requireRole('hotel_owner');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const { searchParams } = new URL(request.url);
  const vendor_id = searchParams.get('vendor_id');
  if (!vendor_id) return errorResponse('vendor_id query param is required', null, 400);

  const supabase = await createClient();
  const { error } = await supabase
    .from('saved_vendors')
    .delete()
    .eq('hotel_owner_id', auth.user.id)
    .eq('vendor_id', vendor_id);

  if (error) throw error;
  return successResponse(null, 'Vendor removed from saved list');
}

export const GET = withErrorHandler(handleGET, 'GET /api/dashboard/hotel-owner/saved');
export const POST = withErrorHandler(handlePOST, 'POST /api/dashboard/hotel-owner/saved');
export const DELETE = withErrorHandler(handleDELETE, 'DELETE /api/dashboard/hotel-owner/saved');
