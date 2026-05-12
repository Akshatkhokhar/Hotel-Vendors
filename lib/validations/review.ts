import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  content: z.string().min(10),
  vendor_id: z.string().uuid(),
});

export type CreateReviewInput = z.infer<typeof reviewSchema>
export type UpdateReviewInput = z.infer<typeof reviewSchema>
