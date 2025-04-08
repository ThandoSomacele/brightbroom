// src/lib/server/hooks/post-payment-hooks.ts
import { cleanerAssignmentService } from "$lib/server/services/cleaner-assignment.service";
import { db } from "$lib/server/db";
import { adminNote, booking } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

/**
 * Hooks that run after a successful payment
 */
export const postPaymentHooks = {
  /**
   * Attempt to auto-assign a cleaner after successful payment
   * @param bookingId The booking ID
   * @returns Success status and cleaner ID if assigned
   */
  async attemptCleanerAssignment(bookingId: string): Promise<{
    success: boolean;
    cleanerId?: string;
    message?: string;
  }> {
    try {
      console.log(`Attempting auto-assignment for booking: ${bookingId}`);
      
      // Auto-assign the cleaner
      const result = await cleanerAssignmentService.autoAssignCleaner(bookingId);
      
      // Record the attempt in admin notes
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId,
        content: result.success 
          ? `Cleaner automatically assigned: ${result.message}`
          : `Automatic cleaner assignment failed: ${result.message}`,
        addedBy: "System (Auto)",
        createdAt: new Date(),
      });
      
      return result;
    } catch (error) {
      console.error(`Error in post-payment cleaner assignment for booking ${bookingId}:`, error);
      
      // Record the error
      try {
        await db.insert(adminNote).values({
          id: crypto.randomUUID(),
          bookingId,
          content: `Error during automatic cleaner assignment: ${error instanceof Error ? error.message : 'Unknown error'}`,
          addedBy: "System (Auto)",
          createdAt: new Date(),
        });
      } catch (noteError) {
        console.error("Failed to create admin note about assignment error:", noteError);
      }
      
      return {
        success: false,
        message: "Internal server error during cleaner assignment",
      };
    }
  },
  
  /**
   * Run all post-payment hooks
   * @param bookingId The booking ID
   */
  async runAll(bookingId: string): Promise<void> {
    try {
      // Get booking status to ensure it's confirmed
      const bookingData = await db
        .select({ status: booking.status })
        .from(booking)
        .where(eq(booking.id, bookingId))
        .limit(1);
      
      if (bookingData.length === 0 || bookingData[0].status !== "CONFIRMED") {
        console.log(`Skipping post-payment hooks for booking ${bookingId}: not in CONFIRMED status`);
        return;
      }
      
      // Run the hooks in sequence
      console.log(`Running post-payment hooks for booking ${bookingId}`);
      
      // 1. Attempt cleaner assignment
      await this.attemptCleanerAssignment(bookingId);
      
      // 2. Add more hooks here as needed
      
    } catch (error) {
      console.error(`Error running post-payment hooks for booking ${bookingId}:`, error);
    }
  }
};
