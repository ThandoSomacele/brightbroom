---
paths:
  - "src/hooks.server.ts"
  - "src/lib/server/auth.ts"
  - "src/lib/server/admin-scope.ts"
  - "src/routes/admin/**"
  - "src/routes/cleaner/**"
  - "src/routes/auth/**"
---
# Auth, hooks, tenancy

- Hooks run in order: `handlePostHogProxy` (bypasses auth and CSRF) → `handleAuth` → `handleCSRF` → `handleRouting` → `handleErrors`.
- Sessions are custom (oslo + Argon2id), 30 days, renewed within 15 days of expiry. Protected routes check the role in `+page.server.ts` / `+layout.server.ts`.
- CSRF token in `event.locals.csrf`. `multipart/form-data` and urlencoded form posts skip the header check; API calls need `x-csrf-token`.
- Multi-tenancy: each cleaning company is a `tenant` (branding, commission rate, service areas). Users join via `tenantMember` (OWNER, ADMIN, MANAGER). Bookings, services, cleaner profiles and applications carry `tenantId`; services may be platform-wide (`tenantId = null`). The original business is the tenant with `isPlatformOwner`.
- `handleAuth` loads `event.locals.tenant` and `event.locals.tenantMembership` for TENANT_ADMIN and ADMIN.
- Admin actions: `requireAdmin(locals)` first, then `getScopedCleaner/Application/Booking`; list loads use `adminTenantScope(locals)`.
- Errors: custom types in `src/lib/utils/errors.ts`; `+error.svelte` pages; form errors returned from actions.
