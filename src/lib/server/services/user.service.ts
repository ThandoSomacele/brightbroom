// src/lib/server/services/user.service.ts
import { db } from '$lib/server/db';
import { user, address, type User } from '$lib/server/db/schema';
import { eq, like, or, and, desc } from 'drizzle-orm';

/**
 * User service for managing users in the database
 */
export const userService = {
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    const [userData] = await db.select().from(user).where(eq(user.id, id)).limit(1);
    return userData || null;
  },

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const [userData] = await db.select().from(user).where(eq(user.email, email)).limit(1);
    return userData || null;
  },

  /**
   * Get user by ID with addresses
   */
  async getUserWithAddresses(id: string): Promise<{ user: User, addresses: any[] } | null> {
    const [userData] = await db.select().from(user).where(eq(user.id, id)).limit(1);
    
    if (!userData) return null;
    
    const addresses = await db.select().from(address).where(eq(address.userId, id));
    
    return {
      user: userData,
      addresses
    };
  },

  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: "CUSTOMER" | "CLEANER" | "ADMIN";
  }): Promise<User> {
    const [newUser] = await db.insert(user).values({
      id: crypto.randomUUID(),
      ...data
    }).returning();
    
    return newUser;
  },

  /**
   * Update user information
   */
  async updateUser(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      role: "CUSTOMER" | "CLEANER" | "ADMIN";
    }>
  ): Promise<User> {
    const [updatedUser] = await db.update(user)
      .set(data)
      .where(eq(user.id, id))
      .returning();
    
    return updatedUser;
  },

  /**
   * Get all users with optional filtering
   */
  async getUsers(params?: {
    role?: "CUSTOMER" | "CLEANER" | "ADMIN";
    skip?: number;
    take?: number;
    search?: string;
  }): Promise<User[]> {
    const { role, skip = 0, take = 50, search } = params || {};

    let query = db.select().from(user);

    if (role) {
      query = query.where(eq(user.role, role));
    }

    if (search) {
      query = query.where(
        or(
          like(user.firstName, `%${search}%`),
          like(user.lastName, `%${search}%`),
          like(user.email, `%${search}%`)
        )
      );
    }

    return await query
      .limit(take)
      .offset(skip)
      .orderBy(desc(user.createdAt));
  },

  /**
   * Count users with optional filtering
   */
  async countUsers(params?: { role?: "CUSTOMER" | "CLEANER" | "ADMIN"; search?: string }): Promise<number> {
    const { role, search } = params || {};

    let query = db.select({count: db.fn.count()}).from(user);

    if (role) {
      query = query.where(eq(user.role, role));
    }

    if (search) {
      query = query.where(
        or(
          like(user.firstName, `%${search}%`),
          like(user.lastName, `%${search}%`),
          like(user.email, `%${search}%`)
        )
      );
    }

    const result = await query;
    return Number(result[0].count) || 0;
  },

  /**
   * Delete a user by ID
   */
  async deleteUser(id: string): Promise<User> {
    const [deletedUser] = await db.delete(user)
      .where(eq(user.id, id))
      .returning();
    
    return deletedUser;
  }
};
