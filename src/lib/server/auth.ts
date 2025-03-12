// src/lib/server/auth.ts
import { Lucia, type Session, type User } from "lucia";
import { dev } from "$app/environment";
import { db } from "./db";
import { session, user, key } from "./db/schema";
import { eq } from "drizzle-orm";
import { generateRandomString, isWithinExpiration } from "lucia/utils";

// Create the auth object with Drizzle adapter
export const lucia = new Lucia({
  adapter: {
    getUser: async (userId) => {
      const result = await db.select().from(user).where(eq(user.id, userId)).limit(1);
      return result[0] || null;
    },
    getSession: async (sessionId) => {
      const result = await db.select().from(session).where(eq(session.id, sessionId)).limit(1);
      return result[0] || null;
    },
    getSessionsByUserId: async (userId) => {
      return await db.select().from(session).where(eq(session.userId, userId));
    },
    getKeysByUserId: async (userId) => {
      return await db.select().from(key).where(eq(key.userId, userId));
    },
    getKey: async (keyId) => {
      const result = await db.select().from(key).where(eq(key.id, keyId)).limit(1);
      return result[0] || null;
    },
    setSession: async (newSession) => {
      await db.insert(session).values(newSession);
      return newSession;
    },
    updateSession: async (sessionId, partialSession) => {
      await db.update(session).set(partialSession).where(eq(session.id, sessionId));
    },
    deleteSession: async (sessionId) => {
      await db.delete(session).where(eq(session.id, sessionId));
    },
    deleteSessionsByUserId: async (userId) => {
      await db.delete(session).where(eq(session.userId, userId));
    },
    deleteKeysByUserId: async (userId) => {
      await db.delete(key).where(eq(key.userId, userId));
    },
    setKey: async (newKey) => {
      await db.insert(key).values(newKey);
      return newKey;
    },
    deleteKey: async (keyId) => {
      await db.delete(key).where(eq(key.id, keyId));
    },
    updateKey: async (keyId, partialKey) => {
      await db.update(key).set(partialKey).where(eq(key.id, keyId));
    },
    setUser: async (newUser) => {
      await db.insert(user).values(newUser);
      return newUser;
    },
    deleteUser: async (userId) => {
      await db.delete(user).where(eq(user.id, userId));
    },
    updateUser: async (userId, partialUser) => {
      await db.update(user).set(partialUser).where(eq(user.id, userId));
    }
  },
  env: dev ? "DEV" : "PROD",
  sessionCookie: {
    attributes: {
      secure: !dev
    }
  },
  getUserAttributes: (userData) => {
    return {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role
    };
  }
});

// Helper functions
export function generateUserId(): string {
  return generateRandomString(15);
}

export function generateSessionId(): string {
  return generateRandomString(40);
}

// Declare types for Lucia
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      firstName: string;
      lastName: string;
      role: "CUSTOMER" | "CLEANER" | "ADMIN";
    };
  }
}
