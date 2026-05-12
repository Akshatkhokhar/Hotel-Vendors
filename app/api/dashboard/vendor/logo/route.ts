import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { getCurrentUser } from '@/lib/helpers/auth';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB for logos

async function handlePOST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return errorResponse('Unauthorized', null, 401);

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) return errorResponse('No file provided', null, 400);
  if (!ALLOWED_TYPES.includes(file.type)) return errorResponse('Invalid file type. Only JPEG, PNG, WEBP, and SVG are allowed.', null, 400);
  if (file.size > MAX_SIZE) return errorResponse('File too large. Maximum size is 2 MB.', null, 400);

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `logos/${fileName}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('vendor-assets')
      .upload(filePath, buffer, { 
        contentType: file.type,
        cacheControl: '3600', 
        upsert: false 
      });
    
    if (uploadError) {
      console.error('Admin Upload Error:', uploadError.message);
      return errorResponse('Failed to upload to storage: ' + uploadError.message, null, 500);
    }
    
    const { data } = supabaseAdmin.storage.from('vendor-assets').getPublicUrl(filePath);
    
    return successResponse({ url: data.publicUrl }, 'Logo uploaded successfully', 201);
  } catch (err: any) {
    console.error('Exception during admin upload:', err);
    return errorResponse('Internal server error during upload', err.message, 500);
  }
}

export const POST = withErrorHandler(handlePOST, 'POST /api/dashboard/vendor/logo');
