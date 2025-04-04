// src/lib/server/services/address.service.ts
import { db } from '$lib/server/db';
import { address } from '$lib/server/db/schema';
import { and, eq, ne } from 'drizzle-orm';

// Maximum allowed addresses per user
export const MAX_ADDRESSES = 3;

/**
 * Service for managing user addresses
 */
export const addressService = {
  /**
   * Get all addresses for a user
   */
  async getUserAddresses(userId: string): Promise<typeof address.$inferSelect[]> {
    try {
      return await db.select()
        .from(address)
        .where(eq(address.userId, userId))
        .orderBy(address.isDefault, { direction: 'desc' });
    } catch (error) {
      console.error('Error fetching user addresses:', error);
      return [];
    }
  },
  /**
   * Count user's addresses
   */
  async countUserAddresses(userId: string): Promise<number> {
    try {
      const result = await db.select({ count: db.fn.count() })
        .from(address)
        .where(eq(address.userId, userId));
      
      return Number(result[0].count) || 0;
    } catch (error) {
      console.error('Error counting user addresses:', error);
      return 0;
    }
  },

  /**
   * Check if user has reached address limit
   */
  async hasReachedAddressLimit(userId: string): Promise<boolean> {
    const count = await this.countUserAddresses(userId);
    return count >= MAX_ADDRESSES;
  },

  /**
   * Ensures only one address is set as default for a user
   * @param userId The user ID
   * @param addressId Optional address ID to exclude from update (the one to be set as default)
   */
  async ensureSingleDefaultAddress(userId: string, addressId?: string): Promise<void> {
    try {
      // Build the query to update all addresses except the one being set as default
      let query = db.update(address)
        .set({ isDefault: false })
        .where(eq(address.userId, userId));
      
      // If we have an addressId, exclude it from the update
      if (addressId) {
        query = query.where(ne(address.id, addressId));
      }
      
      // Execute the update
      await query;
      
      console.log(`Updated default status for user ${userId}, new default: ${addressId || 'none'}`);
    } catch (error) {
      console.error('Error ensuring single default address:', error);
      throw error;
    }
  },

  /**
   * Create a new address for a user
   */
  async createAddress(userId: string, addressData: {
    street: string;
    aptUnit?: string;
    city: string;
    state: string;
    zipCode: string;
    instructions?: string;
    isDefault?: boolean;
  }): Promise<typeof address.$inferSelect> {
    try {
      // Check if user has reached the address limit
      const hasReachedLimit = await this.hasReachedAddressLimit(userId);
      if (hasReachedLimit) {
        throw new Error(`Maximum limit of ${MAX_ADDRESSES} addresses reached`);
      }

      // If this address will be default, update other addresses first
      if (addressData.isDefault) {
        await this.ensureSingleDefaultAddress(userId);
      }

      // Create the new address
      const addressId = crypto.randomUUID();
      const [newAddress] = await db.insert(address)
        .values({
          id: addressId,
          userId,
          ...addressData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return newAddress;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  },

  /**
   * Update an existing address
   */
  async updateAddress(userId: string, addressId: string, addressData: {
    street?: string;
    aptUnit?: string | null;
    city?: string;
    state?: string;
    zipCode?: string;
    instructions?: string | null;
    isDefault?: boolean;
  }): Promise<typeof address.$inferSelect | null> {
    try {
      // Verify the address belongs to this user
      const [existingAddress] = await db.select()
        .from(address)
        .where(and(
          eq(address.id, addressId),
          eq(address.userId, userId)
        ))
        .limit(1);
      
      if (!existingAddress) {
        return null;
      }
      
      // If setting as default, update other addresses first
      if (addressData.isDefault) {
        await this.ensureSingleDefaultAddress(userId, addressId);
      }
      
      // Update the address
      const [updatedAddress] = await db.update(address)
        .set({
          ...addressData,
          updatedAt: new Date()
        })
        .where(eq(address.id, addressId))
        .returning();
      
      return updatedAddress;
    } catch (error) {
      // Check if the error is a redirect
      if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
          // This is a redirect, not an error - rethrow it so the action handler can process it
          throw error;
      }
      
      console.error('Error updating address:', error);
      throw error;
    }
  },
  
  /**
   * Set an address as the default
   */
  async setDefaultAddress(userId: string, addressId: string): Promise<typeof address.$inferSelect | null> {
    try {
      // First verify the address belongs to this user
      const [existingAddress] = await db.select()
        .from(address)
        .where(and(
          eq(address.id, addressId),
          eq(address.userId, userId)
        ))
        .limit(1);
      
      if (!existingAddress) {
        return null;
      }
      
      // Update all other addresses to not be default
      await this.ensureSingleDefaultAddress(userId, addressId);
      
      // Set this address as default
      const [updatedAddress] = await db.update(address)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(address.id, addressId))
        .returning();
      
      return updatedAddress;
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  },

  /**
   * Delete an address
   */
  async deleteAddress(userId: string, addressId: string): Promise<boolean> {
    try {
      // Verify the address belongs to this user
      const [existingAddress] = await db.select()
        .from(address)
        .where(and(
          eq(address.id, addressId),
          eq(address.userId, userId)
        ))
        .limit(1);
      
      if (!existingAddress) {
        return false;
      }

      // Delete the address
      await db.delete(address)
        .where(eq(address.id, addressId));
      
      return true;
    } catch (error) {
      console.error('Error deleting address:', error);
      return false;
    }
  }
};
