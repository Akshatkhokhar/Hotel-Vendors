import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { updateVendorSchema } from '@/lib/validations/vendor';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

/**
 * @swagger
 * /api/dashboard/vendor/profile:
 *   get:
 *     tags: [Dashboard - Vendor]
 *     summary: Get vendor profile for editing
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Full editable vendor profile
 */
async function handleGET() {

  const auth = await requireRole('vendor');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const supabase = await createClient();

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select(`
      id, slug, company_name, tagline, description, logo_url, website,
      is_featured, status, created_at,
      vendor_locations(id, address_line_1, city, state, postal_code, is_primary),
      vendor_contacts(id, contact_name, email, phone, is_primary),
      vendor_categories(category_id)
    `)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) throw error;
  if (!vendor) return errorResponse('Vendor profile not found', null, 404);

  const formatted: any = { ...vendor, category_ids: vendor.vendor_categories.map((vc: any) => vc.category_id) };
  delete formatted.vendor_categories;

  return successResponse(formatted, 'Vendor profile retrieved');
}

/**
 * @swagger
 * /api/dashboard/vendor/profile:
 *   put:
 *     tags: [Dashboard - Vendor]
 *     summary: Update vendor profile
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Any vendor fields to update
 *     responses:
 *       200:
 *         description: Profile updated
 */
async function handlePUT(request: NextRequest) {

  const auth = await requireRole('vendor');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const body = await request.json();
  const validated = updateVendorSchema.safeParse(body);
  if (!validated.success) {
    console.error('VENDOR PROFILE VALIDATION ERROR:', JSON.stringify(validated.error.format(), null, 2));
    return errorResponse('Validation failed', validated.error.format(), 400);
  }

  const supabase = await createClient();

  const { custom_category, category_ids, locations, contacts, company_name, ...rest } = validated.data;
  let finalCategoryIds = category_ids || [];

  // Handle Custom Category Auto-Creation
  if (custom_category && custom_category.trim()) {
    const categoryName = custom_category.trim();
    const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Check if category exists
    const { data: existingCat } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle();

    if (existingCat) {
      if (!finalCategoryIds.includes(existingCat.id)) {
        finalCategoryIds.push(existingCat.id);
      }
    } else {
      // Create new category
      const { data: newCat, error: createError } = await supabaseAdmin
        .from('categories')
        .insert([{ name: categoryName, slug: categorySlug }])
        .select('id')
        .single();
      
      if (!createError && newCat) {
        finalCategoryIds.push(newCat.id);
      }
    }
  }

  let { data: vendor } = await supabase.from('vendors').select('id, slug').eq('user_id', auth.user.id).maybeSingle();
  
  const updatePayload: any = { ...rest, status: 'approved', user_id: auth.user.id };
  
  if (company_name) {
    updatePayload.company_name = company_name;
    if (!vendor?.slug) {
      updatePayload.slug = company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
  }

  if (!vendor) {
    const { data: newVendor, error: insertError } = await supabase
      .from('vendors')
      .insert([updatePayload])
      .select('id')
      .single();
    
    if (insertError) throw insertError;
    vendor = newVendor;
  } else {
    const { error: updateError } = await supabase
      .from('vendors')
      .update(updatePayload)
      .eq('id', vendor.id);
    
    if (updateError) throw updateError;
  }

  if (locations) {
    await supabaseAdmin.from('vendor_locations').delete().eq('vendor_id', vendor.id);
    if (locations.length > 0) await supabaseAdmin.from('vendor_locations').insert(locations.map((l: any) => ({ ...l, vendor_id: vendor.id })));
  }
  if (contacts) {
    await supabaseAdmin.from('vendor_contacts').delete().eq('vendor_id', vendor.id);
    if (contacts.length > 0) await supabaseAdmin.from('vendor_contacts').insert(contacts.map((c: any) => ({ ...c, vendor_id: vendor.id })));
  }
  if (finalCategoryIds.length > 0) {
    await supabaseAdmin.from('vendor_categories').delete().eq('vendor_id', vendor.id);
    await supabaseAdmin.from('vendor_categories').insert(finalCategoryIds.map((id: any) => ({ vendor_id: vendor.id, category_id: id })));
  }

  // Fetch the full updated profile to return
  const { data: updatedVendor, error: fetchError } = await supabaseAdmin
    .from('vendors')
    .select(`
      id, slug, company_name, tagline, description, logo_url, website,
      is_featured, status, created_at,
      vendor_locations(id, address_line_1, city, state, postal_code, is_primary),
      vendor_contacts(id, contact_name, email, phone, is_primary),
      vendor_categories(category_id)
    `)
    .eq('id', vendor.id)
    .single();

  if (fetchError) throw fetchError;

  const formatted: any = { ...updatedVendor, category_ids: updatedVendor.vendor_categories.map((vc: any) => vc.category_id) };
  delete formatted.vendor_categories;

  return successResponse(formatted, 'Vendor profile updated successfully');
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRole('vendor');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const supabase = await createClient();

  // Find the vendor
  const { data: vendor, error: findError } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (findError) return errorResponse('Failed to find vendor profile', findError.message, 500);
  if (!vendor) return errorResponse('No vendor profile found to delete', null, 404);

  // Delete everything related to this vendor
  // vendor_categories, vendor_locations, vendor_contacts are linked by vendor_id
  // We'll use supabaseAdmin to ensure we have permission to clean up
  const { error: deleteError } = await supabaseAdmin
    .from('vendors')
    .delete()
    .eq('id', vendor.id);

  if (deleteError) return errorResponse('Failed to remove vendor card', deleteError.message, 500);

  return successResponse(null, 'Vendor card successfully removed from marketplace');
}

export const GET = withErrorHandler(handleGET, 'GET /api/dashboard/vendor/profile');
export const PUT = withErrorHandler(handlePUT, 'PUT /api/dashboard/vendor/profile');
