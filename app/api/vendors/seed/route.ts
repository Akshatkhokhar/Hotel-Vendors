import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { generateSlug } from '@/lib/helpers/slug';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

async function handlePOST(request: NextRequest) {
  const auth = await requireRole('admin');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const { vendors } = await request.json();
  if (!Array.isArray(vendors) || vendors.length === 0) {
    return errorResponse('Invalid payload. Expected array of vendors.', null, 400);
  }

  let seededCount = 0;
  const errors: any[] = [];

  for (const v of vendors) {
    try {
      const { company_name, location, contact_name, phone, logo_url } = v;
      if (!company_name) continue;

      let city = '', state = '';
      if (location) {
        const parts = location.split(',').map((s: string) => s.trim());
        if (parts.length >= 2) { city = parts[0]; state = parts[1]; }
        else city = parts[0];
      }

      let baseSlug = generateSlug(company_name);
      let slug = baseSlug, counter = 1;
      while (true) {
        const { data } = await supabaseAdmin.from('vendors').select('id').eq('slug', slug).maybeSingle();
        if (!data) break;
        counter++; slug = `${baseSlug}-${counter}`;
      }

      const { data: vendorData, error: vendorError } = await supabaseAdmin
        .from('vendors')
        .upsert({ company_name, slug, logo_url, status: 'approved', source: 'scraped', user_id: auth.user.id },
          { onConflict: 'company_name', ignoreDuplicates: true })
        .select('id').single();

      if (vendorError && vendorError.code !== '23505') throw vendorError;

      const vendorId = vendorData?.id;
      if (!vendorId) continue;

      if (city || state) {
        await supabaseAdmin.from('vendor_locations').insert({ vendor_id: vendorId, city, state, is_primary: true });
      }
      if (contact_name || phone) {
        await supabaseAdmin.from('vendor_contacts').insert({ vendor_id: vendorId, contact_name, phone, is_primary: true });
      }

      seededCount++;
    } catch (err: any) {
      errors.push({ company_name: v.company_name, error: err.message });
    }
  }

  return successResponse({ seededCount, errors }, 'Seeding completed', 201);
}

export const POST = withErrorHandler(handlePOST, 'POST /api/vendors/seed');
