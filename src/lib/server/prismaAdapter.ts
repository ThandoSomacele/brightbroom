// src/lib/server/prismaAdapter.ts
import type { Adapter } from "lucia";
import type { PrismaClient } from "@prisma/client";

export function createPrismaAdapter(prisma: PrismaClient): Adapter {
  return {
    // Get user by ID
    async getUser(userId) {
      const user = await prisma.user.findUnique({
        where: {
          id: userId
        }
      });
      
      if (!user) return null;
      
      return {
        id: user.id,
        attributes: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          passwordHash: user.passwordHash
        }
      };
    },
    
    // Get session by ID
    async getSession(sessionId) {
      const session = await prisma.session.findUnique({
        where: {
          id: sessionId
        }
      });
      
      if (!session) return null;
      
      return {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        attributes: {}
      };
    },
    
    // Create a new session
    async setSession(session) {
      await prisma.session.create({
        data: {
          id: session.id,
          userId: session.userId,
          expiresAt: session.expiresAt
        }
      });
    },
    
    // Delete a session
    async deleteSession(sessionId) {
      await prisma.session.delete({
        where: {
          id: sessionId
        }
      }).catch(() => {
        // Ignore error if session doesn't exist
      });
    },
    
    // Delete expired sessions for user
    async deleteExpiredSessions() {
      await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
    },
    
    // Get sessions for user
    async getUserSessions(userId) {
      const sessions = await prisma.session.findMany({
        where: {
          userId
        }
      });
      
      return sessions.map(session => ({
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        attributes: {}
      }));
    },
    
    // Set a key for a user
    async setKey(key) {
      await prisma.key.create({
        data: {
          id: key.id,
          userId: key.userId,
          hashedPassword: key.hashedPassword
        }
      });
    },
    
    // Get key by ID
    async getKey(keyId) {
      const key = await prisma.key.findUnique({
        where: {
          id: keyId
        }
      });
      
      if (!key) return null;
      
      return {
        id: key.id,
        userId: key.userId,
        hashedPassword: key.hashedPassword
      };
    },
    
    // Delete a key
    async deleteKey(keyId) {
      await prisma.key.delete({
        where: {
          id: keyId
        }
      }).catch(() => {
        // Ignore error if key doesn't exist
      });
    },
    
    // Delete all keys for a user
    async deleteUserKeys(userId) {
      await prisma.key.deleteMany({
        where: {
          userId
        }
      });
    }
  };
}
