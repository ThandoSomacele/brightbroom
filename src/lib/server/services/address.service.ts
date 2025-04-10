// src/lib/server/services/address.service.ts
import { MAX_ADDRESSES } from "$lib/constants/address";
import { db } from "$lib/server/db";
import { address, booking } from "$lib/server/db/schema";
import { and, eq, ne } from "drizzle-orm";

/**
 * Service for managing user addresses
 */
export const addressService = {
  /**
   * Get all active addresses for a user
   */
  async getUserAddresses(
    userId: string,
    includeInactive: boolean = false
  ): Promise<(typeof address.$inferSelect)[]> {
    try {
      let query = db
        .select()
        .from(address)
        .where(eq(address.userId, userId));
        
      // Only include active addresses unless specifically requested
      if (!includeInactive) {
        query = query.where(eq(address.isActive, true));
      }
        
      return await query.orderBy(address.isDefault, { direction: "desc" });
    } catch (error) {
      console.error("Error fetching user addresses:", error);
      return [];
    }
  },

  /**
   * Count user's active addresses
   */
  async countUserAddresses(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: db.fn.count() })
        .from(address)
        .where(and(
          eq(address.userId, userId),
          eq(address.isActive, true)
        ));
  
      // Add safer access to the count property
      return result && result.length > 0 && result[0].count !== undefined 
        ? Number(result[0].count) 
        : 0;
    } catch (error) {
      console.error("Error counting user addresses:", error);
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
  async ensureSingleDefaultAddress(
    userId: string,
    addressId?: string,
  ): Promise<void> {
    try {
      // Build the query to update all addresses except the one being set as default
      let query = db
        .update(address)
        .set({ isDefault: false })
        .where(and(
          eq(address.userId, userId),
          eq(address.isActive, true) // Only update active addresses
        ));

      // If we have an addressId, exclude it from the update
      if (addressId) {
        query = query.where(ne(address.id, addressId));
      }

      // Execute the update
      await query;

      console.log(
        `Updated default status for user ${userId}, new default: ${addressId || "none"}`,
      );
    } catch (error) {
      console.error("Error ensuring single default address:", error);
      throw error;
    }
  },

  /**
   * Create a new address for a user
   */
  async createAddress(
    userId: string,
    addressData: {
      street: string;
      aptUnit?: string;
      city: string;
      state: string;
      zipCode: string;
      instructions?: string;
      isDefault?: boolean;
      lat?: number | null;
      lng?: number | null;
    },
  ): Promise<typeof address.$inferSelect> {
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
      
      // Extract lat and lng if provided, otherwise use default values
      const { lat, lng, ...otherAddressData } = addressData;
      
      const [newAddress] = await db
        .insert(address)
        .values({
          id: addressId,
          userId,
          ...otherAddressData,
          // Add lat/lng if they exist
          ...(lat !== undefined && { lat }),
          ...(lng !== undefined && { lng }),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
  
      return newAddress;
    } catch (error) {
      // Check if the error is a redirect
      if (error && typeof error === 'object' && 
          'status' in error && 'location' in error) {
        // This is a redirect, not an error - rethrow it
        throw error;
      }
      
      console.error("Error creating address:", error);
      throw error;
    }
  },

  /**
   * Update an existing address
   */
  async updateAddress(
    userId: string,
    addressId: string,
    addressData: {
      street?: string;
      aptUnit?: string | null;
      city?: string;
      state?: string;
      zipCode?: string;
      instructions?: string | null;
      isDefault?: boolean;
    },
  ): Promise<typeof address.$inferSelect | null> {
    try {
      // Verify the address belongs to this user and is active
      const [existingAddress] = await db
        .select()
        .from(address)
        .where(and(
          eq(address.id, addressId), 
          eq(address.userId, userId),
          eq(address.isActive, true)
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
      const [updatedAddress] = await db
        .update(address)
        .set({
          ...addressData,
          updatedAt: new Date(),
        })
        .where(eq(address.id, addressId))
        .returning();

      return updatedAddress;
    } catch (error) {
      // Check if the error is a redirect
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        "location" in error
      ) {
        // This is a redirect, not an error - rethrow it so the action handler can process it
        throw error;
      }

      console.error("Error updating address:", error);
      throw error;
    }
  },

  /**
   * Set an address as the default
   */
  async setDefaultAddress(
    userId: string,
    addressId: string,
  ): Promise<typeof address.$inferSelect | null> {
    try {
      // First verify the address belongs to this user and is active
      const [existingAddress] = await db
        .select()
        .from(address)
        .where(and(
          eq(address.id, addressId), 
          eq(address.userId, userId),
          eq(address.isActive, true)
        ))
        .limit(1);

      if (!existingAddress) {
        return null;
      }

      // Update all other addresses to not be default
      await this.ensureSingleDefaultAddress(userId, addressId);

      // Set this address as default
      const [updatedAddress] = await db
        .update(address)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(address.id, addressId))
        .returning();

      return updatedAddress;
    } catch (error) {
      console.error("Error setting default address:", error);
      throw error;
    }
  },

  /**
   * Get an address by ID
   */
  async getAddressById(
    addressId: string,
    includeInactive: boolean = false
  ): Promise<(typeof address.$inferSelect) | null> {
    try {
      let query = db
        .select()
        .from(address)
        .where(eq(address.id, addressId));

      // Only include active addresses unless specifically requested
      if (!includeInactive) {
        query = query.where(eq(address.isActive, true));
      }

      const [result] = await query.limit(1);
      return result || null;
    } catch (error) {
      console.error("Error getting address by ID:", error);
      return null;
    }
  },

  /**
   * Soft delete an address by marking it as inactive
   * This preserves the address for bookings but hides it from user selection
   */
  async softDeleteAddress(
    userId: string,
    addressId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify the address belongs to this user and is active
      const [existingAddress] = await db
        .select()
        .from(address)
        .where(and(
          eq(address.id, addressId), 
          eq(address.userId, userId),
          eq(address.isActive, true)
        ))
        .limit(1);

      if (!existingAddress) {
        return { success: false, error: "Address not found" };
      }

      // If this is the default address, we need to set another address as default
      if (existingAddress.isDefault) {
        // Find another active address to set as default
        const [otherAddress] = await db
          .select()
          .from(address)
          .where(and(
            eq(address.userId, userId),
            ne(address.id, addressId),
            eq(address.isActive, true)
          ))
          .limit(1);

        if (otherAddress) {
          await this.setDefaultAddress(userId, otherAddress.id);
        }
      }

      // Mark the address as inactive (soft delete)
      await db
        .update(address)
        .set({ 
          isActive: false, 
          isDefault: false, // Ensure it's not default anymore
          updatedAt: new Date() 
        })
        .where(eq(address.id, addressId));

      return { success: true };
    } catch (error) {
      console.error("Error soft-deleting address:", error);
      return {
        success: false,
        error: "Failed to delete address due to a server error.",
      };
    }
  },

  /**
   * Delete an address (hard delete)
   * Only allowed if the address is not associated with any bookings
   */
  async deleteAddress(
    userId: string,
    addressId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify the address belongs to this user
      const [existingAddress] = await db
        .select()
        .from(address)
        .where(and(
          eq(address.id, addressId),
          eq(address.userId, userId)
        ))
        .limit(1);

      if (!existingAddress) {
        return { success: false, error: "Address not found" };
      }

      // Check if the address is used in any bookings
      const bookings = await db
        .select({ id: booking.id })
        .from(booking)
        .where(eq(booking.addressId, addressId))
        .limit(1);

      if (bookings.length > 0) {
        // Instead of preventing deletion, soft delete it
        return await this.softDeleteAddress(userId, addressId);
      }

      // If no bookings reference this address, perform hard delete
      await db.delete(address).where(eq(address.id, addressId));

      return { success: true };
    } catch (error) {
      console.error("Error deleting address:", error);
      return {
        success: false,
        error: "Failed to delete address due to a server error.",
      };
    }
  }
};

// Export MAX_ADDRESSES for convenience
export { MAX_ADDRESSES };
