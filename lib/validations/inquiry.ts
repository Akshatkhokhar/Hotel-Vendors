import { z } from 'zod';

export const createInquirySchema = z.object({
  vendor_id: z.string().uuid(),
  subject: z.string().min(5).max(200),
  message: z.string().min(20).max(2000),
  hotel_id: z.string().uuid().optional(),
  guest_name: z.string().optional(),
  guest_email: z.string().email().optional(),
  guest_phone: z.string().optional(),
});

export const replySchema = z.object({
  body: z.string().min(1).max(2000),
  attachments: z.array(z.string().url()).optional(),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>
export type ReplyInput = z.infer<typeof replySchema>
