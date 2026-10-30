// src/lib/server/auth.ts
import { dev } from '$app/environment';
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { eq, getTableColumns } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';
import { db } from './db';
import { session, user } from './db/schema';
import type { RequestEvent } from '@sveltejs/kit';
import type { Session, User } from './db/schema';

/**
 * The signed-in user as the app sees it. It never carries the password hash:
 * locals.user is returned to pages by layout loads, and anything a load
 * returns is serialised into the HTML.
 */
export type SessionUser = Omit<User, 'passwordHash'>;

const { passwordHash: _passwordHash, ...sessionUserColumns } = getTableColumns(user);

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
export async function createSession(token: string, userId: string): Promise<Session> {
  // Hash the token to get the session ID
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
  
  try {
    // Create the session in the database
    const [newSession] = await db.insert(session)
      .values({
        id: sessionId,
        userId: userId,
        expiresAt: expiresAt
      })
      .returning();
    
    console.log('Session created successfully:', sessionId);
    return newSession;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

// Validate a session token
export async function validateSessionToken(token: string): Promise<{ session: Session | null; user: SessionUser | null }> {
  if (!token) {
    return { session: null, user: null };
  }
  
  try {
    // Hash the token to get the session ID
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    
    // Get the session and user
    const result = await db
      .select({ session, user: sessionUserColumns })
      .from(session)
      .where(eq(session.id, sessionId))
      .innerJoin(user, eq(session.userId, user.id))
      .limit(1);
    
    if (result.length === 0) {
      console.log('No session found for token');
      return { session: null, user: null };
    }
    
    const { session: sessionData, user: userData } = result[0];
    
    // Check if session has expired
    if (new Date() > sessionData.expiresAt) {
      console.log('Session has expired');
      await db.delete(session).where(eq(session.id, sessionId));
      return { session: null, user: null };
    }

    // A deactivated account loses its sessions at once, not when they expire
    if (!userData.isActive) {
      await db.delete(session).where(eq(session.userId, userData.id));
      return { session: null, user: null };
    }
    
    // Extend session if it's close to expiring (within 15 days)
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
    
    if (sessionData.expiresAt < fifteenDaysFromNow) {
      console.log('Extending session expiration');
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
  } catch (error) {
    console.error('Error validating session:', error);
    return { session: null, user: null };
  }
}

// Invalidate a session
export async function invalidateSession(sessionId: string): Promise<void> {
  try {
    await db.delete(session).where(eq(session.id, sessionId));
    console.log('Session invalidated successfully:', sessionId);
  } catch (error) {
    console.error('Error invalidating session:', error);
    throw error;
  }
}

// Set a session cookie
export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
  try {
    event.cookies.set("session", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      expires: expiresAt,
      // Secure everywhere but the local dev server. Not NODE_ENV: Netlify's
      // production runtime reports "development".
      secure: !dev
    });
    console.log('Session cookie set successfully');
  } catch (error) {
    console.error('Error setting session cookie:', error);
    throw error;
  }
}

// Delete the session cookie
export function deleteSessionTokenCookie(event: RequestEvent): void {
  try {
    event.cookies.set("session", "", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 0
    });
    console.log('Session cookie deleted successfully');
  } catch (error) {
    console.error('Error deleting session cookie:', error);
    throw error;
  }
}

// Helper function to get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const users = await db.select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/** Every session a user has, e.g. after their password or email changes */
export async function invalidateUserSessions(userId: string): Promise<void> {
  await db.delete(session).where(eq(session.userId, userId));
}

let dummyHash: Promise<string> | null = null;

/**
 * Check an email and password. A wrong email costs the same hash verification
 * as a wrong password, so response times don't reveal which accounts exist,
 * and "inactive" is only reported once the password is right.
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<{ ok: true; user: SessionUser } | { ok: false; reason: 'invalid' | 'inactive' }> {
  const hasher = new Argon2id();
  const found = await getUserByEmail(email.trim().toLowerCase());

  if (!found) {
    dummyHash ??= hasher.hash(encodeBase32LowerCaseNoPadding(crypto.getRandomValues(new Uint8Array(20))));
    await hasher.verify(await dummyHash, password);
    return { ok: false, reason: 'invalid' };
  }

  if (!(await hasher.verify(found.passwordHash, password))) {
    return { ok: false, reason: 'invalid' };
  }
  if (!found.isActive) {
    return { ok: false, reason: 'inactive' };
  }

  const { passwordHash: _hash, ...safeUser } = found;
  return { ok: true, user: safeUser };
}

/**
 * A hash nobody can log in with: for accounts created by an admin, which get
 * their password through a set-password link instead of a temporary one.
 */
export async function unusablePasswordHash(): Promise<string> {
  return new Argon2id().hash(encodeBase32LowerCaseNoPadding(crypto.getRandomValues(new Uint8Array(32))));
}
