import type { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { withErrorHandler } from '@/lib/helpers/errorHandler';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/helpers/auth';

async function handlePOST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return errorResponse('Authentication required', null, 401);
    }

    const dealId = params.id;
    const body = await request.json();

    const {
      message,
      contact_email,
      contact_phone,
      hotel_id
    } = body;

    // Validation
    if (!contact_email) {
      return errorResponse('Contact email is required', null, 400);
    }

    // Check if deal exists and is active
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('id, vendor_id, status, expires_at')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return errorResponse('Deal not found', null, 404);
    }

    if (deal.status !== 'active' || new Date(deal.expires_at) < new Date()) {
      return errorResponse('Deal is no longer active', null, 400);
    }

    // Get user profile to ensure they're a hotel owner
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, hotel_owners(id)')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'hotel_owner') {
      return errorResponse('Only hotel owners can inquire about deals', null, 403);
    }

    const hotelOwnerId = profile.hotel_owners?.[0]?.id;
    if (!hotelOwnerId) {
      return errorResponse('Hotel owner profile not found', null, 404);
    }

    // Create the deal inquiry
    const { data: inquiry, error } = await supabaseAdmin
      .from('deal_inquiries')
      .insert({
        deal_id: dealId,
        hotel_owner_id: hotelOwnerId,
        hotel_id: hotel_id || null,
        message: message || null,
        contact_email,
        contact_phone: contact_phone || null,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating deal inquiry:', error);
      return errorResponse('Failed to create inquiry', error, 500);
    }

    // TODO: Send notification to vendor about new inquiry
    // This could be implemented with email notifications or in-app notifications

    return successResponse(inquiry, 'Inquiry sent successfully');

  } catch (error) {
    console.error('Error in deal inquiry POST:', error);
    return errorResponse('Failed to send inquiry', null, 500);
  }
}

export const POST = withErrorHandler(handlePOST, 'POST /api/deals/[id]/inquire');