# BrightBroom

A cleaning service booking platform built with SvelteKit, enabling customers to book cleaning services and manage their appointments online.

## Tech Stack

- **Framework**: SvelteKit (Svelte 5) with TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Lucia Auth v3
- **Styling**: TailwindCSS
- **Payments**: PayFast (South African payment gateway)
- **Email**: Resend
- **Maps**: Google Maps API
- **Analytics**: PostHog
- **Hosting**: Netlify

## Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL) or a Neon database account
- Google Maps API key
- Resend API key (for email functionality)
- PayFast merchant account (for payments)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd brightbroom
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration (see [Environment Variables](#environment-variables))

4. **Set up the database**
   ```bash
   # Option A: Local Docker PostgreSQL
   npm run db:start

   # Option B: Use Neon (update DATABASE_URL in .env)
   ```

5. **Push database schema**
   ```bash
   npm run db:push
   ```

6. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PUBLIC_URL` | Site URL (e.g., `https://brightbroom.com`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Server-side Google Maps key |
| `VITE_GOOGLE_MAPS_API_KEY` | Client-side Google Maps key |
| `RESEND_API_KEY` | Resend email service key |
| `PAYFAST_MERCHANT_ID` | PayFast merchant ID |
| `PAYFAST_MERCHANT_KEY` | PayFast merchant key |
| `PAYFAST_PASSPHRASE` | PayFast passphrase |
| `PAYFAST_SANDBOX_MODE` | Set to `true` for testing |
| `PUBLIC_POSTHOG_KEY` | PostHog analytics key |
| `CRON_SECRET_TOKEN` | Token for cron job authentication |

## Development Commands

```bash
# Start dev server
npm run dev

# Type checking
npm run check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format

# Run tests
npm run test

# Build for production
npm run build
```

## Database Commands

```bash
# Start local PostgreSQL (Docker)
npm run db:start

# Stop local PostgreSQL
npm run db:stop

# Push schema changes (development)
npm run db:push

# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (DB GUI)
npm run db:studio

# Seed database
npm run db:seed
```

## Project Structure

```
src/
├── lib/
│   ├── components/     # Svelte components by feature
│   ├── server/         # Server-side code (auth, db, email)
│   ├── stores/         # Svelte stores
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── routes/             # SvelteKit file-based routing
│   ├── admin/          # Admin dashboard (protected)
│   ├── cleaner/        # Cleaner portal (protected)
│   ├── auth/           # Authentication pages
│   ├── api/            # API endpoints
│   └── book/           # Booking flow
└── app.d.ts            # Global type declarations
```

## User Roles

- **CUSTOMER**: Can book services and manage their bookings
- **CLEANER**: Can view assigned jobs and update job status
- **ADMIN**: Full access to manage bookings, cleaners, and settings

## Deployment

The project is configured for Netlify deployment using `@sveltejs/adapter-netlify`.

```bash
# Pre-deployment checks
npm run deploy:check

# Validate environment variables
npm run deploy:validate-env
```

**Note**: Do not create a `_redirects` file manually - SvelteKit's adapter handles all routing.

## License

Private - All rights reserved
