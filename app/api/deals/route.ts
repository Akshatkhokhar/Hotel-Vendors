import type { NextRequest } from 'next/server'
import { successResponse, errorResponse, paginatedResponse } from '@/lib/helpers/response';
import { withErrorHandler } from '@/lib/helpers/errorHandler';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/helpers/auth';

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const status = searchParams.get('status') || 'active';
  const vendor_id = searchParams.get('vendor_id');
  
  const offset = (page - 1) * limit;

  try {
    // Base query for deals with vendor information
    let query = supabaseAdmin
      .from('deals')
      .select(`
        *,
        vendors!inner(
          id,
          company_name,
          slug,
          logo_url,
          vendor_locations!inner(city, state, is_primary),
          vendor_categories!inner(
            categories!inner(name, slug)
          )
        )
      `, { count: 'exact' })
      .eq('status', status)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    // Filter by vendor if specified
    if (vendor_id) {
      query = query.eq('vendor_id', vendor_id);
    }

    // Filter by category if specified
    if (category) {
      query = query.eq('vendors.vendor_categories.categories.slug', category);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: deals, count, error } = await query;

    if (error) {
      // If table is missing, return empty gracefully for industry-level resilience
      if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return paginatedResponse([], {
          total: 0, page, limit, totalPages: 0,
          hasNext: false, hasPrev: false,
        }, 'Deals table not initialized, returning empty');
      }
      console.error('Error fetching deals:', error);
      throw error;
    }

    if (!deals || deals.length === 0) {
      return paginatedResponse([], {
        total: 0, page, limit, totalPages: 0,
        hasNext: false, hasPrev: false,
      }, 'No deals found');
    }

    // Transform the data
    const transformedDeals = deals.map((deal: any) => {
      const vendor = deal.vendors;
      const primaryLocation = vendor.vendor_locations?.find((loc: any) => loc.is_primary) || vendor.vendor_locations?.[0];
      const categories = vendor.vendor_categories?.map((vc: any) => vc.categories).filter(Boolean) || [];
      
      // Calculate days left
      const expiresAt = new Date(deal.expires_at);
      const now = new Date();
      const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Format discount display
      let discountDisplay = deal.discount_value;
      if (deal.discount_unit === '%') {
        discountDisplay = `${deal.discount_value}% OFF`;
      } else if (deal.discount_unit === '$') {
        discountDisplay = `$${deal.discount_value} OFF`;
      } else if (deal.discount_unit === 'SHIPPING') {
        discountDisplay = 'FREE SHIPPING';
      }

      return {
        id: deal.id,
        vendor_id: deal.vendor_id,
        vendor_slug: vendor.slug,
        vendor_name: vendor.company_name,
        vendor_logo: vendor.logo_url,
        vendor_city: primaryLocation?.city || '',
        vendor_state: primaryLocation?.state || '',
        category: categories[0]?.name || 'General',
        category_slug: categories[0]?.slug || 'general',
        title: deal.title,
        discount: discountDisplay,
        description: deal.description,
        badge: deal.badge || 'SPECIAL OFFER',
        expires_at: deal.expires_at,
        days_left: Math.max(0, daysLeft),
        minimum_order: deal.minimum_order,
        terms_conditions: deal.terms_conditions,
        current_uses: deal.current_uses,
        maximum_uses: deal.maximum_uses
      };
    });

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return paginatedResponse(transformedDeals, {
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    }, 'Deals retrieved successfully');

  } catch (error) {
    console.error('Error in deals GET:', error);
    return errorResponse('Failed to fetch deals', null, 500);
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return errorResponse('Authentication required', null, 401);
    }

    // Check if user is a vendor
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, vendors(id)')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'vendor' || !profile.vendors?.length) {
      return errorResponse('Only vendors can create deals', null, 403);
    }

    const vendorId = profile.vendors[0].id;
    const body = await request.json();

    const {
      title,
      description,
      deal_type,
      discount_value,
      discount_unit,
      minimum_order,
      maximum_uses,
      terms_conditions,
      badge,
      expires_at
    } = body;

    // Validation
    if (!title || !description || !deal_type || !discount_value || !expires_at) {
      return errorResponse('Missing required fields', null, 400);
    }

    // Create the deal
    const { data: deal, error } = await supabaseAdmin
      .from('deals')
      .insert({
        vendor_id: vendorId,
        title,
        description,
        deal_type,
        discount_value: String(discount_value),
        discount_unit: discount_unit || '%',
        minimum_order: minimum_order || null,
        maximum_uses: maximum_uses || null,
        current_uses: 0,
        terms_conditions: terms_conditions || null,
        badge: badge || 'SPECIAL OFFER',
        status: 'active',
        starts_at: new Date().toISOString(),
        expires_at: new Date(expires_at).toISOString()
      })
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return errorResponse('Deals feature is currently unavailable (table missing)', null, 503);
      }
      console.error('Error creating deal:', error);
      return errorResponse('Failed to create deal', error, 500);
    }

    return successResponse(deal, 'Deal created successfully');

  } catch (error) {
    console.error('Error in deals POST:', error);
    return errorResponse('Failed to create deal', null, 500);
  }
}

export const GET = withErrorHandler(handleGET, 'GET /api/deals');
export const POST = withErrorHandler(handlePOST, 'POST /api/deals');
