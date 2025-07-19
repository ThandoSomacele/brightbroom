# BrightBroom - Cleaner Bookings Made Simple

## Project Overview

BrightBroom makes cleaner bookings simple by enabling users to book professional cleaners for their homes and offices. The application focuses on providing a seamless booking experience with flexible scheduling, transparent pricing, and reliable service.

### Key Features

- User authentication and profile management
- Address management for cleaning locations
- Service type selection (regular cleaning, extended cleaning, office cleaning)
- Scheduling and booking management
- Real-time availability of cleaners
- Payment processing with PayFast (South African payment gateway)
- Booking history and receipts
- Admin dashboard for managing cleaners and bookings
- Cleaner mobile interface for managing jobs

## Tech Stack

### Frontend

- **SvelteKit**: Latest stable version with TypeScript
- **Tailwind CSS**: For styling with custom design system
  - Custom theme with BrightBroom brand colors
    - Primary: #20C3AF (teal)
    - Secondary: #C2511F (orange)
  - Dark/light mode support
- **Lucide Icons**: For consistent icon system
- **Superforms**: For form handling and validation in Svelte
- **date-fns**: Date manipulation library
- **Svelte stores**: For state management

### Backend (SvelteKit Server/API Routes)

- **Prisma**: For database ORM
- **Lucia Auth**: Authentication library for SvelteKit
- **PayFast**: South African payment processing
- **Zod**: Schema validation
- **PostgreSQL**: Database

### Infrastructure

- **Vercel** or **Netlify**: Hosting and deployment
- **Neon**: PostgreSQL database hosting
- **Upstash**: Redis for caching (optional)
- **Resend**: Transactional emails

## Documentation Structure

This architecture documentation is divided into multiple files to improve maintainability and organisation:

1. **[Architecture Overview](architecture-overview.md)** (this file)
2. **[Project Structure](project-structure.md)**
3. **[Data Models](data-models.md)**
4. **[Authentication Flow](authentication-flow.md)**
5. **[Booking Flow](booking-flow.md)**
6. **[Payment Processing](payment-processing.md)**
7. **[Admin Dashboard](admin-dashboard.md)**
8. **[Core Components](core-components.md)**
9. **[Testing Strategy](testing-strategy.md)**
10. **[Deployment Strategy](deployment-strategy.md)**
11. **[Next Steps](next-steps.md)**
