// src/lib/server/auth.ts
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { eq } from 'drizzle-orm';
import { db } from './db';
import { session, user } from './db/schema';
import type { RequestEvent } from '@sveltejs/kit';
import type { Session, User } from './db/schema';

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
export async function validateSessionToken(token: string): Promise<{ session: Session | null; user: User | null }> {
  if (!token) {
    return { session: null, user: null };
  }
  
  try {
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
      secure: process.env.NODE_ENV === 'production' // Only secure in production
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
