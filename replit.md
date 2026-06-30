# Replit Agent Guide

## Overview

This is a luxury e-commerce web application for a flower/floral boutique business. It features a public-facing storefront with product browsing, shopping cart, and checkout functionality, plus an admin panel for managing products, orders, categories, special offers, storefront section ordering, and cover photo/carousel sections. The design follows a mobile-first premium floral commerce aesthetic with a red-violet brand palette, serif typography, rounded product cards, a special-offer promo card, and smooth animations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Structure
The project uses a monorepo structure with three main directories:
- **`client/`** — React single-page application (frontend)
- **`server/`** — Express.js API server (backend)
- **`shared/`** — Shared TypeScript types, schemas, and API route contracts used by both client and server

### Frontend (`client/src/`)
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: 
  - TanStack React Query for server state (API data fetching/caching)
  - Zustand for client-side state (shopping cart with localStorage persistence)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Animations**: Framer Motion for smooth transitions and hover effects
- **Forms**: React Hook Form with Zod validation via `@hookform/resolvers`
- **Styling**: Tailwind CSS with CSS custom properties for theming, supporting dark mode via class strategy. The current visual direction uses red-violet primary colors, soft blush backgrounds, rounded cards, and mobile-first spacing.

### Backend (`server/`)
- **Framework**: Express.js (v5) running on Node.js
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: express-session with MemoryStore (development), connect-pg-simple available for production
- **Authentication**: Simple session-based admin auth (username/password stored in DB)
- **API Design**: RESTful JSON API under `/api/` prefix. Route contracts defined in `shared/routes.ts` using Zod schemas for type safety across client and server.

### Shared Layer (`shared/`)
- **`schema.ts`**: Drizzle ORM table definitions and Zod insert schemas (categories, products, special offers, orders, order items, reviews, settings, admin users)
- **`routes.ts`**: API contract definitions with path, method, input schemas, and response schemas — consumed by both frontend hooks and backend route handlers

### Database Schema (PostgreSQL via Drizzle)
Key tables:
- **`categories`** — Product categories with slug, name, image, display order
- **`products`** — Products with name, slug, category reference, price, stock, images array, badges array, SKU, active flag
- **`orders`** — Customer orders with order number (RUL-XXXX format), customer info, delivery details, payment method (COD/GCash/bank), status tracking
- **`order_items`** — Line items linking orders to products with quantity and price
- **`reviews`** — Customer reviews
- **`settings`** — Key-value store for site settings, including `section_order` for storefront ordering and `cover_sections` for cover photo/carousel banner data
- **`special_offers`** — Admin-managed homepage promotional offer cards with editable title, label, discount, button, image, theme, destination, active flag, and display order
- **`admin_users`** — Admin credentials for the dashboard

### Storefront Section Ordering

The homepage All view uses `settings.section_order` to render sections in admin-defined order. Section keys use these formats:
- `category:<id>` for category product sections
- `badge:<name>` for badge/tag sections
- `cover:<id>` for cover photo sections

Cover photo section definitions are stored in `settings.cover_sections` as JSON. Each cover section has an `id`, `title`, and `images` array. A single image renders as a banner; multiple images render as an auto-rotating carousel with dot controls. Cover sections are managed in `client/src/pages/admin/products.tsx` and rendered in `client/src/pages/home.tsx`.

### Build System
- **Development**: `tsx server/index.ts` runs the Express server with Vite dev middleware for HMR
- **Production Build**: Custom `script/build.ts` that runs Vite build for the client and esbuild for the server, outputting to `dist/`
- **Database Migrations**: `drizzle-kit push` for schema synchronization

### Key Pages
- **Public**: Home/shop (mobile-first search, special offer, filterable product grid, draggable admin-defined section order, cover banner/carousel sections), Product Detail, Checkout
- **Admin** (protected): Dashboard (analytics), Products management with WebP image upload (500KB max), visual Special Offers editor with WebP image upload, Theme & Logo Settings with WebP logo upload, Orders management
- **Auth**: Login page for admin access

## External Dependencies

- **PostgreSQL**: Primary database, connected via `DATABASE_URL` environment variable. Required for the application to start.
- **Drizzle Kit**: Used for database schema management (`npm run db:push` to sync schema)
- **Google Fonts**: Playfair Display (serif headings) and Inter (body text) loaded via CDN
- **Unsplash**: Default placeholder product images referenced via unsplash URLs
- **No external payment gateway**: Payment methods (COD, GCash, bank transfer) are recorded but not processed through a gateway

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Secret for express-session (falls back to "secret" in dev)

## Known API Route Ordering Note

`GET /api/orders/verify-purchase` must be registered **before** `GET /api/orders/:orderNumber` in `server/routes.ts` to avoid the wildcard param swallowing it. This is already fixed and must be maintained when editing routes.

## Order Item Variants

`variantId` and `variantColorName` are optional fields in the order create input schema (`shared/routes.ts`). They are preserved through Zod parsing and saved to `order_items` by `storage.createOrder`.