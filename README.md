# HotelVendors.com - B2B Hospitality Marketplace

A premium B2B marketplace connecting hospitality brands, hotel owners, and procurement managers with specialized trade partners, manufacturers, and service providers.

## 🚀 Overview

HotelVendors.com streamlines the procurement process in the hospitality industry. It provides a high-fidelity platform for vendors to showcase their products/services and for hotel owners to discover, save, and inquire about essential hospitality assets.

### Key Features
- **Vendor Directory**: Advanced filtering by category, region, and business stage.
- **Vendor Dashboard**: Complete business profile management, inquiry inbox, and review tracking.
- **Secure Authentication**: Multi-provider OAuth (Google, Microsoft) and secure email login with Turnstile protection.
- **Inquiry System**: Direct communication channel between buyers and sellers.
- **Privacy First**: Masked contact details to prevent scraping and protect vendor privacy.
- **Premium UI**: Modern, glassmorphic design system built for professional hospitality standards.

## 🛠 Tech Stack

- **Framework**: [Next.js 15+ (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Icons**: [Phosphor Icons](https://phosphoricons.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Form Handling**: React State & Modern Fetch API

## 📁 Project Structure

```text
├── app/                  # Next.js App Router (Pages & API Routes)
│   ├── api/              # Backend API endpoints
│   ├── dashboard/        # Vendor & User dashboards
│   └── vendors/          # Public vendor directory and profiles
├── components/           # Reusable UI components
├── lib/                  # Core logic, services, and shared utilities
│   ├── context/          # React Context providers (Auth, etc.)
│   ├── supabase/         # Supabase clients (Client, Server, Admin)
│   └── validations/      # Zod schemas for data integrity
├── public/               # Static assets (images, fonts, etc.)
├── scripts/              # Database maintenance and setup scripts
└── types/                # Shared TypeScript definitions
```

## ⚙️ Getting Started

### 1. Clone & Install
```bash
git clone <repository-url>
cd Hotel-Vendor
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory (use `.env.example` as a template):


### 3. Run Development Server
```bash
npm run dev
```

## 🔒 Security & Privacy
- **RLS (Row Level Security)**: Strict database policies ensure users only access their own data.
- **Server-side Proxy**: API requests are proxied via `proxy.ts` to enforce authentication and content-type headers.
- **Email Masking**: Automatic masking of email-based contact names in the public directory.

## 📄 License
Internal Proprietary - All Rights Reserved.
