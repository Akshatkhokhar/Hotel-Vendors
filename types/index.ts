// ── Enums matching Supabase DB enums ──

export type UserRole = 'vendor' | 'hotel_owner' | 'admin'

export type VendorStatus = 
  'pending' | 'approved' | 'rejected' | 'suspended'

export type VendorSource = 
  'manual' | 'scraped' | 'imported' | 'self_signup'

export type EmployeeRange = 
  '1-10' | '11-50' | '51-200' | '201-500' | '500+'

export type InquiryStatus = 
  'new' | 'read' | 'replied' | 'closed' | 'spam'

export type NotificationType =
  | 'inquiry_received'
  | 'inquiry_replied'
  | 'review_received'
  | 'subscription_renewed'
  | 'subscription_expiring'
  | 'vendor_approved'
  | 'vendor_rejected'
  | 'system'

export type DealStatus = 'active' | 'expired' | 'draft' | 'paused'

export type DealType = 'percentage' | 'fixed_amount' | 'free_shipping' | 'bundle' | 'other'

export type HotelType =
  | 'hotel' | 'motel' | 'resort'
  | 'b_and_b' | 'boutique'
  | 'extended_stay' | 'other'

// ── Database Row Types ──

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  is_verified: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  user_id: string | null
  company_name: string
  slug: string
  tagline: string | null
  description: string | null
  website: string | null
  logo_url: string | null
  banner_url: string | null
  established_year: number | null
  employee_range: EmployeeRange | null
  plan_id: string | null
  is_featured: boolean
  featured_until: string | null
  source: VendorSource
  status: VendorStatus
  view_count: number
  inquiry_count: number
  review_count: number
  average_rating: number | null
  created_at: string
  updated_at: string
}

export interface VendorLocation {
  id: string
  vendor_id: string
  label: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface VendorContact {
  id: string
  vendor_id: string
  contact_name: string | null
  designation: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface VendorImage {
  id: string
  vendor_id: string
  image_url: string
  storage_path: string
  alt_text: string | null
  width: number | null
  height: number | null
  file_size: number | null
  mime_type: string | null
  sort_order: number
  created_at: string
}

export interface Category {
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VendorInquiry {
  id: string
  vendor_id: string
  hotel_owner_id: string | null
  hotel_id: string | null
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  subject: string | null
  status: InquiryStatus
  last_message_at: string
  read_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface InquiryMessage {
  id: string
  inquiry_id: string
  sender_id: string | null
  sender_role: UserRole | null
  body: string
  attachments: Record<string, unknown> | null
  created_at: string
}

export interface VendorReview {
  id: string
  vendor_id: string
  hotel_owner_id: string
  rating: number
  title: string | null
  body: string | null
  is_verified_purchase: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Hotel {
  id: string
  owner_id: string
  name: string
  hotel_type: HotelType
  room_count: number | null
  chain_affiliation: string | null
  address_line_1: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  created_at: string
  updated_at: string
}

export interface HotelOwner {
  id: string
  business_name: string | null
  business_email: string | null
  business_phone: string | null
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  vendor_id: string
  title: string
  description: string
  deal_type: DealType
  discount_value: string // e.g., "15", "100", "FREE"
  discount_unit: string // e.g., "%", "$", "SHIPPING"
  minimum_order: number | null
  maximum_uses: number | null
  current_uses: number
  terms_conditions: string | null
  badge: string | null // e.g., "FLASH SALE", "LIMITED TIME"
  status: DealStatus
  starts_at: string
  expires_at: string
  created_at: string
  updated_at: string
}

export interface DealInquiry {
  id: string
  deal_id: string
  hotel_owner_id: string
  hotel_id: string | null
  message: string | null
  contact_email: string
  contact_phone: string | null
  status: 'new' | 'contacted' | 'closed'
  created_at: string
  updated_at: string
}

// ── API Types ──

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message: string
}

export interface ApiErrorResponse {
  success: false
  message: string
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiPaginatedResponse<T = unknown> {
  success: true
  data: T[]
  pagination: PaginationMeta
  message: string
}

// ── Auth Types ──

export interface AuthUser {
  id: string
  email: string
}

export interface AuthContext {
  user: AuthUser
  profile: Profile
}

// ── Vendor Card (used in listings) ──

export interface VendorCard {
  id: string
  slug: string
  company_name: string
  tagline: string | null
  logo_url: string | null
  is_featured: boolean
  average_rating: number | null
  review_count: number
  city: string | null
  state: string | null
  categories: string[]
  contact_name: string | null
  phone: string | null
}

// ── Scraped Vendor Data ──

export interface ScrapedVendor {
  company_name: string
  location: string
  contact_name: string
  phone: string
  logo_url: string
}

// ── Rate Limit Record ──

export interface RateLimitRecord {
  count: number
  resetAt: number
}

// ── Upload Types ──

export interface UploadResult {
  url: string
  storage_path: string
  width: number | null
  height: number | null
  file_size: number | null
}
