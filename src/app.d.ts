// src/app.d.ts
import type { Session, Tenant, TenantMember } from '$lib/server/db/schema';
import type { SessionUser } from '$lib/server/auth';

declare global {
  namespace App {
    interface Locals {
      user: SessionUser | null;
      session: Session | null;
      csrf: string;
      tenant: Tenant | null;
      tenantMembership: TenantMember | null;
    }
  }
}

export { };
