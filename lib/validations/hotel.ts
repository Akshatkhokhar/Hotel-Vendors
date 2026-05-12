import { z } from 'zod';

export const createHotelSchema = z.object({
  name: z.string().min(2).max(200),
  hotel_type: z.string().min(2).max(100),
  room_count: z.coerce.number().min(1).optional(),
  address: z.string().min(5).max(255),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postal_code: z.string().min(2).max(20),
});
