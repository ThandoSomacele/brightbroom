# Cleaner UI Structure

/cleaner/
  ├── +layout.server.ts      # Authentication and authorization checks
  ├── +layout.svelte         # Layout wrapper with navigation
  ├── +error.svelte          # Error boundary for cleaner section
  ├── dashboard/
  │   ├── +page.server.ts    # Fetch dashboard data (upcoming jobs, earnings summary)
  │   └── +page.svelte       # Dashboard UI with summary cards
  ├── bookings/
  │   ├── +page.server.ts    # Fetch bookings with filtering/pagination
  │   ├── +page.svelte       # Bookings list view
  │   └── [id]/              # Individual booking details
  │       ├── +page.server.ts
  │       └── +page.svelte
  └── earnings/
      ├── +page.server.ts    # Fetch earnings data and payout schedule
      └── +page.svelte       # Earnings overview and history
