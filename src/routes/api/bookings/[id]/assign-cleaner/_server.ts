// src/routes/api/bookings/[id]/assign-cleaner/+server.ts
import { db } from "$lib/server/db";
import { booking } from "$lib/server/db/schema";
import { cleanerAssignmentService } from "$lib/server/services/cleaner-assignment.service";
import { error, json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

export async function POST({ params, locals }) {
  // Ensure the user is authenticated and has admin privileges
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw error(403, "Unauthorized access");
  }

  const bookingId = params.id;

  try {
    // Check if booking exists
    const bookingCheck = await db
      .select({ id: booking.id })
      .from(booking)
      .where(eq(booking.id, bookingId))
      .limit(1);

    if (bookingCheck.length === 0) {
      throw error(404, "Booking not found");
    }

    // Auto-assign a cleaner
    const result = await cleanerAssignmentService.autoAssignCleaner(bookingId);

    if (!result.success) {
      return json({
        success: false,
        message: result.message || "Failed to assign cleaner"
      }, { status: 400 });
    }

    return json({
      success: true,
      cleanerId: result.cleanerId,
      message: result.message || "Cleaner assigned successfully"
    });
  } catch (err) {
    console.error(`Error assigning cleaner to booking ${bookingId}:`, err);
    throw error(500, "Failed to assign cleaner");
  }
}

// GET endpoint to find available cleaners without assigning
export async function GET({ params, locals }) {
  // Ensure the user is authenticated and has admin privileges
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw error(403, "Unauthorized access");
  }

  const bookingId = params.id;

  try {
    // Find available cleaners
    const { cleaners } = await cleanerAssignmentService.findAvailableCleaners(bookingId);

    return json({
      success: true,
      availableCleaners: cleaners
    });
  } catch (err) {
    console.error(`Error finding available cleaners for booking ${bookingId}:`, err);
    throw error(500, "Failed to find available cleaners");
  }
}
