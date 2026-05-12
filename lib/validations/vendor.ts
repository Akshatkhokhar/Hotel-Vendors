import { z } from 'zod';

export const createVendorSchema = z.object({
  company_name: z.string().min(1).max(300),
  tagline: z.string().max(1000).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  logo_url: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  category_ids: z.array(z.string()).max(10).default([]),
  custom_category: z.string().max(100).optional().nullable(),
  locations: z.array(z.object({
    address_line_1: z.string().optional().nullable(),
    city: z.string().optional().nullable().or(z.literal('')),
    state: z.string().optional().nullable().or(z.literal('')),
    postal_code: z.string().optional().nullable(),
    is_primary: z.boolean().default(false)
  })).optional().default([]),
  contacts: z.array(z.object({
    contact_name: z.string().optional().nullable().or(z.literal('')),
    designation: z.string().optional().nullable().or(z.literal('')),
    email: z.string().email().optional().nullable().or(z.literal('')),
    phone: z.string().optional().nullable().or(z.literal('')),
    is_primary: z.boolean().default(false)
  })).optional().default([])
});

export const updateVendorSchema = createVendorSchema.partial();

export const vendorQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().max(50).default(12),
  category: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  search: z.string().max(100).optional(),
  sectors: z.string().optional(),
  stages: z.string().optional(),
  regions: z.string().optional(),
  featured: z.enum(['true', 'false']).transform(v => v === 'true').optional().or(z.boolean().optional()),
  sortBy: z.enum(['newest', 'rating', 'popular']).default('newest')
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>
export type VendorQueryInput = z.infer<typeof vendorQuerySchema>
