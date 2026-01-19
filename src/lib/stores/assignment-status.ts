// src/lib/stores/assignment-status.ts
import { writable } from "svelte/store";

/**
 * Store for tracking cleaner assignment status
 */
interface AssignmentStatus {
  bookingId: string | null;
  status: "idle" | "loading" | "success" | "error";
  message: string | null;
  cleanerId: string | null;
  cleanerName: string | null;
  retries: number;
  lastUpdated: Date | null;
}

// Initialise with default values
const defaultStatus: AssignmentStatus = {
  bookingId: null,
  status: "idle",
  message: null,
  cleanerId: null,
  cleanerName: null,
  retries: 0,
  lastUpdated: null,
};

// Create the writable store
const assignmentStatus = writable<AssignmentStatus>(defaultStatus);

/**
 * Assignment status service
 */
export const assignmentStatusService = {
  /**
   * Initialise tracking for a booking
   * @param bookingId The booking ID
   */
  InitialiseTracking(bookingId: string) {
    assignmentStatus.set({
      ...defaultStatus,
      bookingId,
      lastUpdated: new Date(),
    });
  },

  /**
   * Check assignment status for a booking
   * @param bookingId The booking ID
   * @returns Promise with assignment result
   */
  async checkAssignmentStatus(bookingId: string): Promise<{
    assigned: boolean;
    cleanerId?: string;
    cleanerName?: string;
  }> {
    try {
      assignmentStatus.update((status) => ({
        ...status,
        status: "loading",
        message: "Checking cleaner assignment status...",
        lastUpdated: new Date(),
      }));

      // Fetch booking details including cleaner assignment
      const response = await fetch(`/api/bookings/${bookingId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch booking details");
      }

      const data = await response.json();

      if (data.cleaner) {
        // Cleaner is assigned
        assignmentStatus.update((status) => ({
          ...status,
          status: "success",
          message: `Cleaner assigned: ${data.cleaner.firstName} ${data.cleaner.lastName}`,
          cleanerId: data.cleaner.id,
          cleanerName: `${data.cleaner.firstName} ${data.cleaner.lastName}`,
          lastUpdated: new Date(),
        }));

        return {
          assigned: true,
          cleanerId: data.cleaner.id,
          cleanerName: `${data.cleaner.firstName} ${data.cleaner.lastName}`,
        };
      } else {
        // No cleaner assigned yet
        assignmentStatus.update((status) => ({
          ...status,
          status: "idle",
          message: "No cleaner assigned yet",
          lastUpdated: new Date(),
        }));

        return { assigned: false };
      }
    } catch (error) {
      console.error("Error checking assignment status:", error);

      assignmentStatus.update((status) => ({
        ...status,
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        lastUpdated: new Date(),
      }));

      return { assigned: false };
    }
  },

  /**
   * Trigger assignment process for a booking
   * @param bookingId The booking ID
   * @returns Promise with assignment result
   */
  async triggerAssignment(bookingId: string): Promise<{
    success: boolean;
    cleanerId?: string;
    message?: string;
  }> {
    try {
      assignmentStatus.update((status) => ({
        ...status,
        status: "loading",
        message: "Assigning cleaner...",
        retries: status.retries + 1,
        lastUpdated: new Date(),
      }));

      const response = await fetch(
        `/api/bookings/${bookingId}/assign-cleaner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to assign cleaner");
      }

      if (data.success) {
        // Assignment successful
        assignmentStatus.update((status) => ({
          ...status,
          status: "success",
          message: data.message || "Cleaner assigned successfully",
          cleanerId: data.cleanerId,
          lastUpdated: new Date(),
        }));

        return {
          success: true,
          cleanerId: data.cleanerId,
          message: data.message,
        };
      } else {
        // Assignment failed
        assignmentStatus.update((status) => ({
          ...status,
          status: "error",
          message: data.message || "Failed to assign cleaner",
          lastUpdated: new Date(),
        }));

        return {
          success: false,
          message: data.message,
        };
      }
    } catch (error) {
      console.error("Error triggering assignment:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      assignmentStatus.update((status) => ({
        ...status,
        status: "error",
        message: errorMessage,
        lastUpdated: new Date(),
      }));

      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  /**
   * Reset assignment tracking
   */
  reset() {
    assignmentStatus.set(defaultStatus);
  },
};

// Export the store and service
export { assignmentStatus };
