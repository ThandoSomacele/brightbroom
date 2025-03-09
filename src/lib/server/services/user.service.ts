import { prisma } from '$lib/server/prisma';
import type { User, UserRole } from '@prisma/client';
import type { UserWithAddresses } from '$lib/types/prisma';

/**
 * User service for managing users in the database
 */
export const userService = {
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id }
    });
  },

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email }
    });
  },

  /**
   * Get user by ID with addresses
   */
  async getUserWithAddresses(id: string): Promise<UserWithAddresses | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { addresses: true }
    });
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
    role?: UserRole;
  }): Promise<User> {
    return prisma.user.create({
      data
    });
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
      role: UserRole;
    }>
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data
    });
  },

  /**
   * Get all users with optional filtering
   */
  async getUsers(params?: {
    role?: UserRole;
    skip?: number;
    take?: number;
    search?: string;
  }): Promise<User[]> {
    const { role, skip = 0, take = 50, search } = params || {};

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });
  },

  /**
   * Count users with optional filtering
   */
  async countUsers(params?: { role?: UserRole; search?: string }): Promise<number> {
    const { role, search } = params || {};

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.user.count({ where });
  },

  /**
   * Delete a user by ID
   */
  async deleteUser(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id }
    });
  }
};
