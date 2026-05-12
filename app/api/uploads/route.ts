import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { getCurrentUser } from '@/lib/helpers/auth';
import { withErrorHandler } from '@/lib/helpers/errorHandler';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * @swagger
 * /api/uploads:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload vendor logo or gallery image
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, type]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (jpeg, png, webp — max 5MB)
 *               type:
 *                 type: string
 *                 enum: [logo, gallery]
 *                 description: Type of upload
 *               vendor_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     url: { type: string, format: uri }
 *                     width: { type: integer }
 *                     height: { type: integer }
 *       400:
 *         description: Invalid file type or size
 */
async function handlePOST(request: NextRequest) {

  const user = await getCurrentUser();
  if (!user) return errorResponse('Unauthorized', null, 401);

  const formData = await request.formData();
  const file = formData.get('file');
  const uploadType = formData.get('type') as string; // 'logo' | 'gallery'
  const vendorId = formData.get('vendor_id') as string;

  if (!file || typeof file === 'string') return errorResponse('No file provided', null, 400);
  if (!ALLOWED_TYPES.includes(file.type)) return errorResponse('Invalid file type. Only JPEG, PNG, and WebP are allowed.', null, 400);
  if (file.size > MAX_SIZE) return errorResponse('File too large. Maximum size is 5 MB.', null, 400);
  if (!vendorId) return errorResponse('vendor_id is required', null, 400);

  const supabase = await createClient();
  const { data: vendor } = await supabase.from('vendors').select('id, user_id').eq('id', vendorId).single();

  if (!vendor) return errorResponse('Vendor not found', null, 404);

  const userRole = user.user_metadata?.role;
  if (vendor.user_id !== user.id && userRole !== 'admin') return errorResponse('Forbidden', null, 403);

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${uploadType}-${Date.now()}.${fileExt}`;
  const filePath = `vendors/${vendorId}/${fileName}`;

  try {
    const { error: uploadError } = await supabaseAdmin.storage
      .from('vendor-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload Error:', uploadError.message);
      return errorResponse('Failed to upload to storage: ' + uploadError.message, null, 500);
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from('vendor-assets').getPublicUrl(filePath);
    const url = publicUrlData.publicUrl;

    if (uploadType === 'logo') {
      await supabaseAdmin.from('vendors').update({ logo_url: url }).eq('id', vendorId);
    } else {
      await supabaseAdmin.from('vendor_images').insert({
        vendor_id: vendorId, 
        image_url: url,
        storage_path: filePath
      });
    }

    return successResponse(
      { url, storage_path: filePath },
      'File uploaded successfully', 201
    );
  } catch (err: any) {
    console.error('Exception during upload:', err);
    return errorResponse('Internal server error during upload', err.message, 500);
  }
}

export const POST = withErrorHandler(handlePOST, 'POST /api/uploads');
