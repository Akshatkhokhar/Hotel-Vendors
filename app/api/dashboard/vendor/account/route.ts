import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { errorResponse, successResponse } from '@/lib/helpers/response';
import { requireRole } from '@/lib/helpers/auth';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

async function handleDELETE(_request: NextRequest) {
  const auth = await requireRole('vendor');
  if (!auth.authorized || !auth.user) return errorResponse(auth.error, null, auth.status);

  const supabase = await createClient();

  // Find the vendor record for this user
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (vendorError) {
    console.error('Error fetching vendor:', vendorError);
    return errorResponse('Failed to delete account', vendorError, 500);
  }

  // Delete vendor-related rows first (best-effort)
  if (vendor?.id) {
    const vendorId = vendor.id;

    // Order matters for FK constraints
    try {
      await supabaseAdmin.from('deals').delete().eq('vendor_id', vendorId);
    } catch (e) {
      // Ignore errors if table missing
    }
    await supabaseAdmin.from('vendor_categories').delete().eq('vendor_id', vendorId);
    await supabaseAdmin.from('vendor_contacts').delete().eq('vendor_id', vendorId);
    await supabaseAdmin.from('vendor_locations').delete().eq('vendor_id', vendorId);
    await supabaseAdmin.from('vendor_reviews').delete().eq('vendor_id', vendorId);
    await supabaseAdmin.from('vendor_inquiries').delete().eq('vendor_id', vendorId);
    await supabaseAdmin.from('vendor_views').delete().eq('vendor_id', vendorId);
    await supabaseAdmin.from('vendor_subscriptions').delete().eq('vendor_id', vendorId);

    await supabaseAdmin.from('vendors').delete().eq('id', vendorId);
  }

  // Delete profile row
  await supabaseAdmin.from('profiles').delete().eq('id', auth.user.id);

  // Finally delete the auth user
  const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(auth.user.id);
  if (authDeleteError) {
    console.error('Error deleting auth user:', authDeleteError);
    return errorResponse('Failed to delete auth user', authDeleteError, 500);
  }

  return successResponse(null, 'Account deleted successfully');
}

export const DELETE = withErrorHandler(handleDELETE, 'DELETE /api/dashboard/vendor/account');
