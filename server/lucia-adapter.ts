// src/lib/server/lucia-adapter.ts
import { eq } from "drizzle-orm";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "./db";
import { key, session, user } from "./db/schema";

export const adapter = new DrizzlePostgreSQLAdapter(db, {
  user: user,
  session: session,
  key: key
});
