# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

### Development

- `npm run dev` - Start development server (Vite + SvelteKit)
- `npm run dev:debug` - Start development server with debug logging
- `npm run check` - Run TypeScript checks (uses svelte-check)
- `npm run check:watch` - Run TypeScript checks in watch mode

### Production

- `npm run build` - Build for production (svelte-kit sync + vite build)
- `npm run preview` - Preview production build locally
- `npm run analyze` - Build with bundle analysis

### Testing & Quality

- `npm run test` - Run tests with Vitest
- `npm run test -- path/to/test.ts` - Run a specific test file
- `npm run lint` - Run ESLint on .js, .ts, .svelte files
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting without making changes

### Database

- `npm run db:start` - Start PostgreSQL in Docker container
- `npm run db:stop` - Stop PostgreSQL container
- `npm run db:generate` - Generate new migration from schema changes (outputs to ./drizzle/migrations)
- `npm run db:migrate` - Apply migrations to database
- `npm run db:push` - Push schema changes directly (development)
- `npm run db:studio` - Open Drizzle Studio for database management
- `npm run db:seed` - Seed database with test data
- `npm run db:seed:services` - Seed only services
- `npm run db:seed:users` - Seed only users
- `npm run db:backup` - Create database backup
- `npm run db:backup:full` - Create full database backup

### Utility Scripts

- `npm run services:update` - Update services
- `npm run services:convert` - Convert services format
- `npm run update:address-coordinates` - Update address coordinates
- `npm run update:cleaner-coordinates` - Update cleaner coordinates
- `npm run deploy:check` - Pre-deployment checks
- `npm run deploy:validate-env` - Validate environment variables

## High-Level Architecture

### Tech Stack

- **Framework**: SvelteKit (Svelte 5) with TypeScript (strict mode enabled)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Lucia Auth v3 with Argon2 password hashing
- **Styling**: TailwindCSS with custom color scheme (primary: teal #20C3AF, secondary: orange #C2511F)
- **Email**: Resend for transactional emails
- **Payments**: PayFast integration (South African payment gateway)
- **Hosting**: Configured for Netlify deployment
- **Maps**: Google Maps API for address autocomplete and service area validation

### Project Structure

```
src/
├── lib/
│   ├── components/     # Reusable Svelte components organized by feature
│   │   ├── admin/      # Admin dashboard components
│   │   ├── booking/    # Booking flow components
│   │   ├── cleaner/    # Cleaner portal components
│   │   ├── forms/      # Form components (includes honeypot fields)
│   │   ├── maps/       # Map-related components
│   │   └── ui/         # Generic UI components
│   ├── server/         # Server-side code
│   │   ├── db/         # Database schema and queries
│   │   │   └── schema.ts # Drizzle schema definitions
│   │   ├── hooks/      # Server hooks (post-payment, etc.)
│   │   ├── services/   # Business logic services
│   │   ├── auth.ts     # Authentication logic (Lucia)
│   │   ├── email-service.ts # Email sending logic
│   │   └── email-templates.ts # Email template definitions
│   ├── stores/         # Svelte stores for state management
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript type definitions
├── routes/             # SvelteKit routes (file-based routing)
│   ├── admin/          # Admin dashboard routes (protected)
│   ├── cleaner/        # Cleaner portal routes (protected)
│   ├── auth/           # Authentication routes (login, register, etc.)
│   ├── api/            # API endpoints
│   └── book/           # Booking flow pages
└── app.d.ts           # Global TypeScript declarations
```

### Key Patterns & Conventions

#### Authentication & Authorization

- Uses Lucia Auth v3 with session-based authentication
- User roles: CUSTOMER, CLEANER, ADMIN (defined in schema)
- Session management in `hooks.server.ts`
- Protected routes check user role in `+page.server.ts` or `+layout.server.ts`

#### Server Hooks (hooks.server.ts)

Executed in sequence:
1. `handlePostHogProxy` - Reverse proxy for analytics (bypasses auth/CSRF)
2. `handleAuth` - Session validation and user loading
3. `handleCSRF` - Token generation and validation
4. `handleRouting` - Route protection and admin access control
5. `handleErrors` - Error formatting

#### CSRF Protection

- CSRF tokens automatically generated in `hooks.server.ts`
- Access via `event.locals.csrf` in server-side code
- Form submissions with `multipart/form-data` or `application/x-www-form-urlencoded` skip header validation
- API calls require `x-csrf-token` header
- Exempt paths: `/api/payments/ipn`, `/api/payments/success`, `/api/payments/cancel`, `/api/subscriptions/process-recurring`

#### Database & Data Flow

- Drizzle ORM for type-safe database queries
- Schema defined in `src/lib/server/db/schema.ts`
- Database connections through `src/lib/server/db/index.ts`
- Form actions in `+page.server.ts` files for data mutations
- Load functions fetch data server-side for SSR

#### Type Inference from Schema

- Use `$inferSelect` for read types: `type User = typeof user.$inferSelect`
- Use `$inferInsert` for insert types: `type NewUser = typeof user.$inferInsert`
- All types exported from `src/lib/server/db/schema.ts`

#### Form Handling

- Zod schemas for validation (imported where needed)
- Progressive enhancement with SvelteKit form actions
- Honeypot fields for spam protection (`src/lib/components/forms/HoneypotField.svelte`)
- Server-side validation in form actions

#### Email System

- Templates defined in `src/lib/server/email-templates.ts`
- Sent via Resend API (`src/lib/server/email-service.ts`)
- Includes booking confirmations, password resets, cleaner notifications

#### PayFast Integration

- IPN endpoint: `/api/payments/ipn` (exempt from CSRF, accepts external requests)
- Supports sandbox mode via `PAYFAST_SANDBOX_MODE` env var
- Post-payment hooks in `src/lib/server/hooks/post-payment-hooks.ts`
- Payment validation in `src/lib/server/payment.ts`
- Subscription payments handled via `/api/subscriptions/process-recurring`

#### PostHog Analytics

- Reverse proxy via `/relay-VjWm` path (defined in `hooks.server.ts`)
- Uses EU Cloud endpoints for GDPR compliance
- Cookie consent managed via `$lib/stores/cookieConsent.ts`

#### Service Areas & Addresses

- Validates addresses against defined service areas
- Uses Google Maps API for address autocomplete
- Coordinates stored for cleaner assignments

#### Error Handling

- Custom error types in `src/lib/utils/errors.ts`
- Consistent error pages (`+error.svelte`)
- Form validation errors returned from server actions

### Environment Variables

Key environment variables (see .env.example):

- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `PUBLIC_URL` - Site URL for emails and redirects
- `VITE_GOOGLE_MAPS_API_KEY` - Client-side Google Maps API key
- `RESEND_API_KEY` - Email service API key
- `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_API_KEY` - Payment gateway credentials
- `PAYFAST_SANDBOX_MODE` - Set to "true" for test mode
- `PUBLIC_POSTHOG_KEY` - PostHog analytics API key
- `PUBLIC_POSTHOG_UI_HOST` - PostHog host URL (EU: `https://eu.posthog.com`)
- `CRON_SECRET_TOKEN` - Protects the recurring payment cron endpoint

### Important Notes

- Always use `$lib/` imports for internal modules
- Maintain TypeScript strict mode compliance
- Follow existing component patterns when creating new features
- Server-side code must stay in `src/lib/server/` or `+page.server.ts` files
- Client-side environment variables must be prefixed with `VITE_`
- Use existing email templates and extend as needed
- Validate all user input on the server side

## Netlify Deployment Notes

### Important: DO NOT create a \_redirects file

- SvelteKit's `adapter-netlify` handles all routing automatically
- Creating a manual `_redirects` file will cause build failures with error: "The \_redirects file should be placed in the project root"
- The adapter manages SPA routing, 404 pages, and all redirects internally

### 404 Page

- Custom 404 page is located at `/static/404.html`
- Uses inline CSS styles (no Tailwind CDN to avoid production warnings)
- Automatically served by Netlify for non-existent routes
