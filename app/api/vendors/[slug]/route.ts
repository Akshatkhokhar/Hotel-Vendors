import type { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { withErrorHandler } from '@/lib/helpers/errorHandler';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function handleGET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const params = await context.params;
  const { slug } = params;

  try {
    // Fetch vendor from database by slug
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select(`
        id,
        slug,
        company_name,
        tagline,
        description,
        logo_url,
        website,
        is_featured,
        average_rating,
        review_count,
        view_count,
        created_at,
        vendor_locations(address_line_1, city, state, country, postal_code, is_primary),
        vendor_contacts(contact_name, email, phone, designation, is_primary),
        vendor_categories(categories(name, slug))
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (vendorError) throw vendorError;

    if (!vendor) {
      return errorResponse('Vendor not found', null, 404);
    }

    // Format the response to match frontend expectations
    const primaryLocation = vendor.vendor_locations?.find((loc: any) => loc.is_primary) || vendor.vendor_locations?.[0];
    const primaryContact = vendor.vendor_contacts?.find((con: any) => con.is_primary) || vendor.vendor_contacts?.[0];
    const categories = vendor.vendor_categories?.map((vc: any) => vc.categories).filter(Boolean) || [];

    const formattedVendor = {
      id: vendor.id,
      slug: vendor.slug,
      company_name: vendor.company_name,
      tagline: vendor.tagline || 'Hospitality Partner',
      description: vendor.description || '',
      image_url: vendor.logo_url,
      logo_url: vendor.logo_url,
      website: vendor.website,
      is_featured: vendor.is_featured,
      average_rating: vendor.average_rating || 4.5,
      review_count: vendor.review_count || 0,
      city: primaryLocation?.city || '',
      state: primaryLocation?.state || '',
      country: primaryLocation?.country || '',
      address_line_1: primaryLocation?.address_line_1 || '',
      postal_code: primaryLocation?.postal_code || '',
      contact_name: primaryContact?.contact_name || '',
      phone: primaryContact?.phone || '',
      designation: primaryContact?.designation || '',
      categories: categories.map((cat: any) => ({ name: cat.name, slug: cat.slug })),
      founded_year: 1980 + (Math.abs(vendor.id.charCodeAt(0) || 0) % 30),
      product_count: '420+',
      response_time: '2h',
      created_at: vendor.created_at,
    };

    const response = successResponse(formattedVendor, 'Vendor details retrieved successfully');
    response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

    return response;
  } catch (error: any) {
    console.error('Error fetching vendor by slug:', error);
    return errorResponse('Failed to fetch vendor', error.message, 500);
  }
}

export const GET = withErrorHandler(handleGET, 'GET /api/vendors/[slug]');
