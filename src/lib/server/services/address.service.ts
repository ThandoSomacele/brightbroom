// src/lib/server/services/address.service.ts
import { db } from '$lib/server/db';
import { address } from '$lib/server/db/schema';
import { and, eq, ne } from 'drizzle-orm';

/**
 * Service for managing user addresses
 */
export const addressService = {
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
