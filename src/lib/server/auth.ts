// src/lib/server/auth.ts
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { eq } from 'drizzle-orm';
import { db } from './db';
import { session, user } from './db/schema';

// Generate a random session token
export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

// Generate a random user ID
export function generateUserId(): string {
  return crypto.randomUUID();
}

// Create a session
export async function createSession(token: string, userId: string) {
  // Hash the token to get the session ID
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
  
  // Create the session in the database
  const [newSession] = await db.insert(session)
    .values({
      id: sessionId,
      userId: userId,
      expiresAt: expiresAt
    })
    .returning();
  
  return newSession;
}

// Validate a session token
export async function validateSessionToken(token: string) {
  if (!token) {
    return { session: null, user: null };
  }
  
  // Hash the token to get the session ID
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  
  // Get the session and user
  const result = await db
    .select({ session, user })
    .from(session)
    .where(eq(session.id, sessionId))
    .innerJoin(user, eq(session.userId, user.id))
    .limit(1);
  
  if (result.length === 0) {
    return { session: null, user: null };
  }
  
  const { session: sessionData, user: userData } = result[0];
  
  // Check if session has expired
  if (new Date() > sessionData.expiresAt) {
    await db.delete(session).where(eq(session.id, sessionId));
    return { session: null, user: null };
  }
  
  // Extend session if it's close to expiring (within 15 days)
  const fifteenDaysFromNow = new Date();
  fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
  
  if (sessionData.expiresAt < fifteenDaysFromNow) {
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);
    
    sessionData.expiresAt = newExpiresAt;
    
    await db.update(session)
      .set({ expiresAt: newExpiresAt })
      .where(eq(session.id, sessionId));
  }
  
  return { 
    session: sessionData, 
    user: userData 
  };
}

// Invalidate a session
export async function invalidateSession(sessionId: string) {
  await db.delete(session).where(eq(session.id, sessionId));
}

// Set a session cookie
export function setSessionTokenCookie(event: any, token: string, expiresAt: Date) {
  event.cookies.set("session", token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    expires: expiresAt
  });
}

// Delete the session cookie
export function deleteSessionTokenCookie(event: any) {
  event.cookies.set("session", "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 0
  });
}
