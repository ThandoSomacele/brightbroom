// src/app.d.ts
import type { Session, User, Tenant, TenantMember } from '$lib/server/db/schema';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
      csrf: string;
      tenant: Tenant | null;
      tenantMembership: TenantMember | null;
    }
  }
}

export { };
