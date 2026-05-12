import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  captchaToken: z.string().min(1, 'Verification token is required'),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['vendor', 'hotel_owner']),
  full_name: z.string().min(2),
  phone: z.string().min(10),
  captchaToken: z.string().min(1, 'Verification token is required'),
  
  // Vendor-specific fields
  company_name: z.string().min(2).optional(),
  tagline: z.string().optional(),
  description: z.string().min(10).optional(),
  website: z.string().url().optional().or(z.literal('')),
  established_year: z.number().min(1900).max(new Date().getFullYear()).optional(),
  employee_range: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  
  // Vendor location fields
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  
  // Vendor contact fields
  contact_name: z.string().optional(),
  designation: z.string().optional(),
  contact_phone: z.string().optional(),
  whatsapp: z.string().optional(),
  
  // Hotel Owner-specific fields
  business_name: z.string().min(2).optional(),
  business_email: z.string().email().optional().or(z.literal('')),
  business_phone: z.string().optional(),
  
  // Hotel fields
  hotel_name: z.string().min(2).optional(),
  hotel_type: z.enum(['hotel', 'motel', 'resort', 'b_and_b', 'boutique', 'extended_stay', 'other']).optional(),
  room_count: z.number().min(1).optional(),
  chain_affiliation: z.string().optional(),
  
  // Hotel location fields
  hotel_address_line_1: z.string().optional(),
  hotel_city: z.string().optional(),
  hotel_state: z.string().optional(),
  hotel_country: z.string().optional(),
  hotel_postal_code: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
