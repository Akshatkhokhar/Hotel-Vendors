import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin';
import { withErrorHandler } from '@/lib/helpers/errorHandler';
import { errorResponse, successResponse } from '@/lib/helpers/response';
import { getCurrentUser } from '@/lib/helpers/auth';

async function handleDELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return errorResponse('Authentication required', null, 401);
    }

    const params = await context.params;
    const dealId = params.id;

    // Check if user is a vendor
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, vendors(id)')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return errorResponse('Failed to authorize user', profileError, 500);
    }

    if (!profile || profile.role !== 'vendor' || !profile.vendors?.length) {
      return errorResponse('Only vendors can delete deals', null, 403);
    }

    const vendorId = profile.vendors[0].id;

    // Ensure deal belongs to this vendor
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('id, vendor_id')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError) {
      console.error('Error fetching deal:', dealError);
      return errorResponse('Failed to fetch deal', dealError, 500);
    }

    if (!deal) {
      return errorResponse('Deal not found', null, 404);
    }

    if (deal.vendor_id !== vendorId) {
      return errorResponse('You do not have permission to delete this deal', null, 403);
    }

    const { error: deleteError } = await supabaseAdmin
      .from('deals')
      .delete()
      .eq('id', dealId);

    if (deleteError) {
      console.error('Error deleting deal:', deleteError);
      return errorResponse('Failed to delete deal', deleteError, 500);
    }

    return successResponse(null, 'Deal deleted successfully');
  } catch (error) {
    console.error('Error in deal DELETE:', error);
    return errorResponse('Failed to delete deal', null, 500);
  }
}

export const DELETE = withErrorHandler(handleDELETE, 'DELETE /api/deals/[id]');
