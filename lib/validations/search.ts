import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().max(100).optional(),
  category: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  featured: z.enum(['true', 'false']).transform(v => v === 'true').optional().or(z.boolean().optional()),
  sortBy: z.enum(['newest', 'rating', 'popular']).default('newest'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().max(50).default(12),
});
