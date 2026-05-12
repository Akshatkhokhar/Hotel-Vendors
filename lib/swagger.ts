import { createSwaggerSpec } from 'next-swagger-doc'

export function getApiDocs() {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'HotelVendors.com API',
        version: '1.0.0',
        description: `
          Production API for HotelVendors.com
          A B2B marketplace connecting hotel owners 
          with hospitality suppliers.
          
          ## Authentication
          Most endpoints require a Bearer token.
          Get your token from POST /api/auth/login
          Then click "Authorize" button and enter:
          Bearer YOUR_TOKEN_HERE
          
          ## Roles
          - hotel_owner: Browse, save, inquire, review
          - vendor: Manage profile, view inquiries
          - admin: Full platform management
        `,
        contact: {
          name: 'HotelVendors Support',
          email: 'support@hotelvendors.com'
        }
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        },
        {
          url: 'https://hotelvendors.vercel.app',
          description: 'Production server'
        }
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your access_token from login response'
          }
        },
        schemas: {
          
          // ── Standard Responses ──
          SuccessResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Success' },
              data: { type: 'object' }
            }
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Something went wrong' }
            }
          },
          PaginatedResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: { type: 'array', items: {} },
              pagination: {
                type: 'object',
                properties: {
                  total: { type: 'integer', example: 312 },
                  page: { type: 'integer', example: 1 },
                  limit: { type: 'integer', example: 12 },
                  totalPages: { type: 'integer', example: 26 },
                  hasNext: { type: 'boolean', example: true },
                  hasPrev: { type: 'boolean', example: false }
                }
              }
            }
          },

          // ── Auth Schemas ──
          RegisterRequest: {
            type: 'object',
            required: ['email', 'password', 'full_name', 'role'],
            properties: {
              email: { 
                type: 'string', 
                format: 'email',
                example: 'john@hotelsupply.com' 
              },
              password: { 
                type: 'string', 
                example: 'SecurePass123!',
                description: 'Min 8 chars, 1 uppercase, 1 number, 1 special char'
              },
              full_name: { 
                type: 'string', 
                example: 'John Smith' 
              },
              role: { 
                type: 'string', 
                enum: ['hotel_owner', 'vendor'],
                example: 'hotel_owner'
              },
              phone: { 
                type: 'string', 
                example: '+1 4045551234' 
              }
            }
          },
          LoginRequest: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { 
                type: 'string', 
                format: 'email',
                example: 'john@hotelsupply.com' 
              },
              password: { 
                type: 'string', 
                example: 'SecurePass123!' 
              }
            }
          },
          LoginResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'object',
                properties: {
                  access_token: { type: 'string' },
                  refresh_token: { type: 'string' },
                  expires_in: { type: 'integer', example: 3600 },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      email: { type: 'string' },
                      full_name: { type: 'string' },
                      role: { type: 'string' },
                      avatar_url: { type: 'string' }
                    }
                  }
                }
              }
            }
          },

          // ── Vendor Schemas ──
          VendorCard: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              slug: { type: 'string', example: 'adp-inc' },
              company_name: { type: 'string', example: 'ADP, Inc.' },
              tagline: { type: 'string' },
              logo_url: { type: 'string', format: 'uri' },
              is_featured: { type: 'boolean' },
              average_rating: { type: 'number', example: 4.5 },
              review_count: { type: 'integer', example: 23 },
              city: { type: 'string', example: 'Florham Park' },
              state: { type: 'string', example: 'New Jersey' },
              categories: { 
                type: 'array',
                items: { type: 'string' },
                example: ['Technology & AV', 'Safety & Security']
              },
              contact_name: { type: 'string', example: 'Thomas Bell' },
              phone: { type: 'string', example: '+1 7702384405' }
            }
          },
          VendorFull: {
            allOf: [
              { '$ref': '#/components/schemas/VendorCard' },
              {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  website: { type: 'string', format: 'uri' },
                  established_year: { type: 'integer' },
                  view_count: { type: 'integer' },
                  inquiry_count: { type: 'integer' },
                  locations: { type: 'array', items: {} },
                  contacts: { type: 'array', items: {} },
                  images: { type: 'array', items: {} },
                  reviews: { type: 'array', items: {} }
                }
              }
            ]
          },
          CreateVendorRequest: {
            type: 'object',
            required: ['company_name', 'category_ids'],
            properties: {
              company_name: { 
                type: 'string', 
                example: 'My Hotel Supply Co.' 
              },
              tagline: { type: 'string' },
              description: { type: 'string' },
              website: { 
                type: 'string', 
                format: 'uri',
                example: 'https://myhotelsupply.com' 
              },
              category_ids: {
                type: 'array',
                items: { type: 'string', format: 'uuid' },
                description: 'Min 1, max 5 category IDs'
              },
              locations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    address_line_1: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    postal_code: { type: 'string' },
                    is_primary: { type: 'boolean' }
                  }
                }
              },
              contacts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    contact_name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    is_primary: { type: 'boolean' }
                  }
                }
              }
            }
          },

          // ── Inquiry Schemas ──
          CreateInquiryRequest: {
            type: 'object',
            required: ['subject', 'message'],
            properties: {
              subject: { 
                type: 'string', 
                example: 'Interested in your coffee supply services' 
              },
              message: { 
                type: 'string', 
                example: 'Hello, we run a 50-room hotel in Atlanta...' 
              },
              guest_name: { 
                type: 'string', 
                example: 'John Smith',
                description: 'Required if not logged in'
              },
              guest_email: { 
                type: 'string', 
                format: 'email',
                example: 'john@atlantahotel.com',
                description: 'Required if not logged in'
              },
              guest_phone: { type: 'string' },
              hotel_id: { 
                type: 'string', 
                format: 'uuid',
                description: 'Optional if logged in as hotel_owner'
              }
            }
          },

          // ── Review Schemas ──
          CreateReviewRequest: {
            type: 'object',
            required: ['vendor_id', 'rating'],
            properties: {
              vendor_id: { type: 'string', format: 'uuid' },
              rating: { 
                type: 'integer', 
                minimum: 1, 
                maximum: 5,
                example: 5 
              },
              title: { type: 'string', example: 'Excellent service' },
              body: { 
                type: 'string', 
                example: 'Very professional and timely delivery.' 
              }
            }
          },

          // ── Category Schema ──
          Category: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: 'Coffee & Beverages' },
              slug: { type: 'string', example: 'coffee-beverages' },
              description: { type: 'string' },
              vendor_count: { type: 'integer', example: 45 },
              icon: { type: 'string' }
            }
          }
        }
      },
      security: [],
      tags: [
        { name: 'Health', description: 'Server health check' },
        { name: 'Auth', description: 'Register, login, logout' },
        { name: 'Vendors', description: 'Browse and manage vendors' },
        { name: 'Search', description: 'Search and filter vendors' },
        { name: 'Categories', description: 'Product categories' },
        { name: 'Inquiries', description: 'Contact vendors' },
        { name: 'Reviews', description: 'Rate and review vendors' },
        { name: 'Uploads', description: 'File upload management' },
        { name: 'Dashboard - Vendor', description: 'Vendor portal APIs' },
        { name: 'Dashboard - Hotel Owner', description: 'Hotel owner portal APIs' },
        { name: 'Dashboard - Admin', description: 'Admin management APIs' }
      ]
    }
  })
  return spec
}
