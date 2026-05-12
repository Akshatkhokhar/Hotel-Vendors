import type { NextRequest } from 'next/server'
import { successResponse, errorResponse, paginatedResponse } from '@/lib/helpers/response';
import { vendorQuerySchema } from '@/lib/validations/vendor';
import { withErrorHandler } from '@/lib/helpers/errorHandler';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Helper function to detect placeholder logos
function isPlaceholderLogo(url: string | null | undefined): boolean {
  if (!url) return true;
  return url.includes('admin_assets/img/location.svg');
}

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());

  const validated = vendorQuerySchema.safeParse(queryParams);
  if (!validated.success) {
    return errorResponse('Invalid query parameters', validated.error.format(), 400);
  }

  const { page, limit, category, search, state, city, featured, sortBy, sectors, stages, regions } = validated.data;
  const offset = (page - 1) * limit;

  try {
    // Start with a basic query for vendors, excluding placeholder logos
    let query: any = supabaseAdmin
      .from('vendors')
      .select(`
        id,
        slug,
        company_name,
        tagline,
        description,
        logo_url,
        is_featured,
        average_rating,
        review_count,
        view_count,
        created_at
      `, { count: 'exact' })
      .eq('status', 'approved');

    // Apply category filter at database level
    if (category) {
      // Join with vendor_categories and categories tables to filter by category slug
      query = supabaseAdmin
        .from('vendors')
        .select(`
          id,
          slug,
          company_name,
          tagline,
          description,
          logo_url,
          is_featured,
          average_rating,
          review_count,
          view_count,
          created_at,
          vendor_categories!inner(
            categories!inner(slug)
          )
        `, { count: 'exact' })
        .eq('status', 'approved')
        .eq('vendor_categories.categories.slug', category);
    }

    // Apply search filter (already handled globally below, so we remove the basic one)
    /*
    if (search) {
      query = query.ilike('company_name', `%${search}%`);
    }
    */

    // Apply featured filter
    if (featured !== undefined) {
      query = query.eq('is_featured', featured);
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        query = query.order('average_rating', { ascending: false, nullsFirst: false });
        break;
      case 'popular':
        query = query.order('view_count', { ascending: false, nullsFirst: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Fetch all vendors to allow for global sorting (logos first) and post-query filtering
    // Since we have ~332 vendors, fetching 1000 is safe and efficient
    const queryLimit = 1000;
    const queryOffset = 0;
    
    query = query.range(queryOffset, queryOffset + queryLimit - 1);

    const { data: vendors, count, error } = await query;
    if (error) {
      console.error('Supabase vendors query error:', error);
      throw error;
    }

    if (!vendors || vendors.length === 0) {
      return paginatedResponse([], {
        total: 0, page, limit, totalPages: 0,
        hasNext: false, hasPrev: false,
      }, 'No vendors found');
    }

    // Get vendor IDs for additional queries
    const vendorIds = vendors.map((v: any) => v.id);

    // Fetch active deals for these vendors (non-expired)
    const nowIso = new Date().toISOString();
    const { data: deals, error: dealsError } = await supabaseAdmin
      .from('deals')
      .select('id, vendor_id, title, discount_value, discount_unit, badge, expires_at, status')
      .in('vendor_id', vendorIds)
      .eq('status', 'active')
      .gte('expires_at', nowIso)
      .order('expires_at', { ascending: true });

    if (dealsError) {
      if (!(dealsError.code === 'PGRST204' || dealsError.code === 'PGRST205' || dealsError.message?.includes('Could not find the table'))) {
        console.error('Error fetching deals:', dealsError);
      }
    }

    const dealByVendorId = new Map<string, any>();
    (deals || []).forEach((deal: any) => {
      if (!dealByVendorId.has(deal.vendor_id)) {
        // Format discount display similar to /api/deals
        let discountDisplay = deal.discount_value;
        if (deal.discount_unit === '%') {
          discountDisplay = `${deal.discount_value}% OFF`;
        } else if (deal.discount_unit === '$') {
          discountDisplay = `$${deal.discount_value} OFF`;
        } else if (deal.discount_unit === 'SHIPPING') {
          discountDisplay = 'FREE SHIPPING';
        }

        const expiresAt = new Date(deal.expires_at);
        const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        dealByVendorId.set(deal.vendor_id, {
          id: deal.id,
          title: deal.title,
          discount: discountDisplay,
          badge: deal.badge || 'SPECIAL OFFER',
          expires_at: deal.expires_at,
          days_left: Math.max(0, daysLeft),
        });
      }
    });

    // Fetch locations for these vendors
    const { data: locations, error: locError } = await supabaseAdmin
      .from('vendor_locations')
      .select('vendor_id, city, state, country, is_primary')
      .in('vendor_id', vendorIds);

    if (locError) {
      console.error('Error fetching locations:', locError);
    }

    // Fetch contacts for these vendors  
    const { data: contacts, error: contactError } = await supabaseAdmin
      .from('vendor_contacts')
      .select('vendor_id, contact_name, phone, email, is_primary')
      .in('vendor_id', vendorIds);

    if (contactError) {
      console.error('Error fetching contacts:', contactError);
    }

    // Fetch categories for these vendors
    const { data: vendorCategories, error: catError } = await supabaseAdmin
      .from('vendor_categories')
      .select(`
        vendor_id,
        categories(id, name, slug)
      `)
      .in('vendor_id', vendorIds);

    if (catError) {
      console.error('Error fetching categories:', catError);
    }

    // Apply location filters (state/city)
    let filteredVendors = vendors;

    // Prioritize vendors with logos in the sorting
    filteredVendors = [...filteredVendors].sort((a: any, b: any) => {
      const aHasLogo = a.logo_url && 
        !a.logo_url.includes('admin_assets/img/location.svg') && 
        !a.logo_url.includes('placeholder.png');
      const bHasLogo = b.logo_url && 
        !b.logo_url.includes('admin_assets/img/location.svg') && 
        !b.logo_url.includes('placeholder.png');
        
      if (aHasLogo && !bHasLogo) return -1;
      if (!aHasLogo && bHasLogo) return 1;
      return 0;
    });

    if (state || city) {
      const locationMap = new Map();
      locations?.forEach(loc => {
        if (!locationMap.has(loc.vendor_id)) {
          locationMap.set(loc.vendor_id, []);
        }
        locationMap.get(loc.vendor_id).push(loc);
      });

      filteredVendors = filteredVendors.filter((vendor: any) => {
        const vendorLocations = locationMap.get(vendor.id) || [];
        return vendorLocations.some((loc: any) => {
          if (state && !loc.state?.toLowerCase().includes(state.toLowerCase())) return false;
          if (city && !loc.city?.toLowerCase().includes(city.toLowerCase())) return false;
          return true;
        });
      });
    }

    // Mock filtering for Search, Sectors, Stages, and Regions
    if (search || sectors || stages || regions) {
      const selectedSectors = sectors ? sectors.split(',') : [];
      const selectedStages = stages ? stages.split(',') : [];
      const selectedRegions = regions ? regions.split(',') : [];

      filteredVendors = filteredVendors.filter((vendor: any) => {
        let matchesSearch = true;
        let matchesSector = true;
        let matchesStage = true;
        let matchesRegion = true;

        const vendorContacts = contacts?.filter(c => c.vendor_id === vendor.id) || [];
        const contactNames = vendorContacts.map(c => c.contact_name || '').join(' ').toLowerCase();
        const text = `${vendor.company_name} ${vendor.tagline || ''} ${vendor.description || ''} ${contactNames}`.toLowerCase();

        if (search) {
          const searchLower = search.toLowerCase();
          matchesSearch = text.includes(searchLower);
        }

        if (selectedSectors.length > 0) {
          matchesSector = selectedSectors.some(sector => {
            if (sector === 'Boutique & Heritage') return text.includes('boutique') || text.includes('heritage') || text.includes('premium');
            if (sector === 'Resort & Spa') return text.includes('resort') || text.includes('spa') || text.includes('wellness');
            if (sector === 'Business & Urban') return text.includes('business') || text.includes('urban') || text.includes('corporate');
            if (sector === 'Eco-Sustainable') return text.includes('eco') || text.includes('sustainable') || text.includes('green');
            return false;
          });
        }

        if (selectedStages.length > 0) {
          matchesStage = selectedStages.some(stage => {
            if (stage === 'Design & Concept') return text.includes('design') || text.includes('concept') || text.includes('architecture');
            if (stage === 'Bulk Purchasing') return text.includes('bulk') || text.includes('wholesale') || text.includes('volume');
            if (stage === 'Maintenance & Ops') return text.includes('maintenance') || text.includes('operations') || text.includes('repair');
            if (stage === 'Refurbishment') return text.includes('refurbish') || text.includes('renovate') || text.includes('remodel');
            return false;
          });
        }

        if (selectedRegions.length > 0) {
          const vendorLocations = locations?.filter(loc => loc.vendor_id === vendor.id) || [];
          matchesRegion = selectedRegions.some(region => {
            if (region === 'North America') return vendorLocations.some(loc => !loc.country || loc.country === 'USA' || loc.country === 'Canada');
            if (region === 'EMEA Region') return vendorLocations.some(loc => loc.country && ['UK', 'Germany', 'France', 'UAE'].includes(loc.country));
            if (region === 'Asia Pacific') return vendorLocations.some(loc => loc.country && ['China', 'Japan', 'India', 'Australia'].includes(loc.country));
            return false;
          });
        }

        return matchesSearch && matchesSector && matchesStage && matchesRegion;
      });
    }

    // Apply pagination after post-query filtering and logo sorting
    const totalCount = filteredVendors.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    
    filteredVendors = filteredVendors.slice(offset, offset + limit);

    // Transform the data to match the expected format
    const transformedVendors = filteredVendors.map((vendor: any) => {
      // Find primary location or first location
      const vendorLocations = locations?.filter(loc => loc.vendor_id === vendor.id) || [];
      const primaryLocation = vendorLocations.find(loc => loc.is_primary) || vendorLocations[0];

      // Find primary contact or first contact
      const vendorContacts = contacts?.filter(contact => contact.vendor_id === vendor.id) || [];
      const primaryContact = vendorContacts.find(contact => contact.is_primary) || vendorContacts[0];

      // Get categories for this vendor
      const categories = vendorCategories
        ?.filter(vc => vc.vendor_id === vendor.id)
        ?.map(vc => vc.categories)
        ?.filter(Boolean) || [];

      return {
        id: vendor.id,
        slug: vendor.slug,
        company_name: vendor.company_name,
        tagline: vendor.tagline || 'Hospitality Partner',
        description: vendor.description || '',
        image_url: vendor.logo_url,
        is_featured: vendor.is_featured,
        average_rating: vendor.average_rating,
        review_count: vendor.review_count || 0,
        city: primaryLocation?.city || '',
        state: primaryLocation?.state || '',
        country: primaryLocation?.country || '',
        contact_name: primaryContact?.contact_name || '',
        phone: primaryContact?.phone || '',
        active_deal: dealByVendorId.get(vendor.id) || null,
        categories: categories.map((cat: any) => ({
          name: cat.name,
          slug: cat.slug
        }))
      };
    });

    const response = paginatedResponse(transformedVendors, {
      total: totalCount, 
      page, 
      limit, 
      totalPages,
      hasNext: page < totalPages, 
      hasPrev: page > 1,
    }, 'Vendors retrieved successfully');

    // Cache non-search results
    if (!search) {
      response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    }

    return response;

  } catch (error) {
    console.error('Error fetching vendors:', error);
    throw error;
  }
}

async function handlePOST(request: NextRequest) {
  return errorResponse('Not implemented', null, 501);
}

export const GET = withErrorHandler(handleGET, 'GET /api/vendors');
export const POST = withErrorHandler(handlePOST, 'POST /api/vendors');

