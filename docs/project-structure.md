# Project Structure

## Directory Organization

```
brightbroom/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/ (reusable UI components)
│   │   │   ├── layout/ (layout components)
│   │   │   ├── booking/ (booking-specific components)
│   │   │   ├── admin/ (admin dashboard components)
│   │   │   └── profile/ (user profile components)
│   │   ├── server/ (server-only code)
│   │   │   ├── auth.ts (authentication logic)
│   │   │   ├── booking.ts (booking business logic)
│   │   │   ├── payment.ts (payment processing with PayFast)
│   │   │   └── admin.ts (admin functionality)
│   │   ├── utils/ (utility functions)
│   │   ├── stores/ (Svelte stores)
│   │   ├── schemas/ (Zod validation schemas)
│   │   ├── types/ (TypeScript types and interfaces)
│   │   └── db/ (database setup and queries)
│   ├── routes/
│   │   ├── +page.svelte (homepage)
│   │   ├── +layout.svelte (main layout)
│   │   ├── +error.svelte (error page)
│   │   ├── auth/
│   │   │   ├── login/+page.svelte
│   │   │   ├── register/+page.svelte
│   │   │   └── forgot-password/+page.svelte
│   │   ├── book/
│   │   │   ├── +page.svelte (main booking page)
│   │   │   ├── schedule/+page.svelte
│   │   │   ├── address/+page.svelte
│   │   │   ├── services/+page.svelte
│   │   │   ├── review/+page.svelte
│   │   │   └── confirmation/+page.svelte
│   │   ├── profile/
│   │   │   ├── +page.svelte
│   │   │   ├── bookings/+page.svelte
│   │   │   ├── payments/+page.svelte
│   │   │   └── addresses/+page.svelte
│   │   ├── admin/
│   │   │   ├── +layout.svelte
│   │   │   ├── dashboard/+page.svelte
│   │   │   ├── bookings/+page.svelte
│   │   │   ├── cleaners/+page.svelte
│   │   │   └── users/+page.svelte
│   │   ├── payment/
│   │   │   ├── success/+page.svelte
│   │   │   └── cancel/+page.svelte
│   │   └── api/ (API routes)
│   │       ├── auth/
│   │       ├── bookings/
│   │       ├── payments/
│   │       │   ├── process/+server.ts
│   │       │   └── ipn/+server.ts (PayFast Instant Payment Notification)
│   │       └── admin/
│   └── app.html (SvelteKit HTML template)
├── static/ (static assets)
│   ├── favicon.ico
│   └── images/
├── prisma/
│   ├── schema.prisma (database schema)
│   └── migrations/
├── docs/ (architecture and documentation)
│   ├── architecture/
│   │   ├── architecture-overview.md
│   │   ├── project-structure.md
│   │   └── ... (other documentation files)
├── tests/ (testing files)
├── tailwind.config.js
├── svelte.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## Organizational Principles

### Component Organization

- **UI Components**: Generic, reusable UI elements like buttons, inputs, and cards
- **Layout Components**: Page layouts, headers, footers, and navigation elements
- **Feature Components**: Components specific to features like booking, profile management, etc.
- **Page Components**: Top-level components that represent entire pages

### State Management

- **Local Component State**: Used for UI state specific to a component
- **Svelte Stores**: Used for shared state across components or routes
- **Server Data**: Loaded through SvelteKit's `load` functions

### Typical File Organization

#### Component Structure
```
ComponentName/
├── ComponentName.svelte (main component)
├── ComponentName.test.ts (tests)
└── SubComponents/ (if needed)
    ├── SubComponent1.svelte
    └── SubComponent2.svelte
```

#### Route Structure
```
route-name/
├── +page.svelte (client component)
├── +page.server.ts (server-side logic)
├── +page.ts (shared load function)
└── components/ (route-specific components)
```

### Import Conventions

- Relative paths for closely related files
- Aliased paths for imports across the application:
  - `$lib` for imports from the lib directory
  - `$lib/components` for component imports
  - `$lib/server` for server-only code
