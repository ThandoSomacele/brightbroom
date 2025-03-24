// src/routes/admin/services/[id]/+page.server.ts
import { db } from "$lib/server/db";
import { service, booking, cleanerSpecialisation, user } from "$lib/server/db/schema";
import { error, redirect } from "@sveltejs/kit";
import { eq, and, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { PageServerLoad, Actions } from "./$types";

/**
 * Load detailed information about a specific service and its related data
 */
export const load: PageServerLoad = async ({ params, locals }) => {
  // Check if user is authenticated and is an admin
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw redirect(302, '/auth/login?redirectTo=/admin');
  }

  const serviceId = params.id;
  
  if (!serviceId) {
    throw error(404, "Service not found");
  }

  try {
    // Fetch the service details
    const serviceData = await db
      .select()
      .from(service)
      .where(eq(service.id, serviceId))
      .limit(1);

    if (serviceData.length === 0) {
      throw error(404, "Service not found");
    }

    // Get statistics about this service
    // 1. Total number of bookings
    const bookingCountResult = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number)
      })
      .from(booking)
      .where(eq(booking.serviceId, serviceId));

    const totalBookings = bookingCountResult[0]?.count || 0;

    // 2. Total revenue generated
    const revenueResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${booking.price}), 0)::numeric`.mapWith(Number)
      })
      .from(booking)
      .where(eq(booking.serviceId, serviceId));

    const totalRevenue = revenueResult[0]?.total || 0;

    // 3. Status breakdown
    const statusBreakdownResult = await db
      .select({
        status: booking.status,
        count: sql<number>`count(*)`.mapWith(Number)
      })
      .from(booking)
      .where(eq(booking.serviceId, serviceId))
      .groupBy(booking.status);

    // 4. Recent bookings using this service
    const recentBookings = await db
      .select({
        id: booking.id,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        price: booking.price,
        customerName: sql<string>`${user.firstName} || ' ' || ${user.lastName}`.as('customerName'),
        customerEmail: user.email
      })
      .from(booking)
      .innerJoin(user, eq(booking.userId, user.id))
      .where(eq(booking.serviceId, serviceId))
      .orderBy(desc(booking.scheduledDate))
      .limit(10);

    // 5. Cleaners specializing in this service
    const specialisingCleaners = await db
      .select({
        cleanerId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        experience: cleanerSpecialisation.experience
      })
      .from(cleanerSpecialisation)
      .innerJoin(user, eq(cleanerSpecialisation.cleanerProfileId, user.id))
      .where(eq(cleanerSpecialisation.serviceId, serviceId))
      .orderBy(desc(cleanerSpecialisation.experience));

    // 6. Monthly booking trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    
    const monthlyTrendsResult = await db
      .select({
        month: sql<string>`to_char(${booking.scheduledDate}, 'YYYY-MM')`.as('month'),
        count: sql<number>`count(*)`.mapWith(Number),
        revenue: sql<string>`COALESCE(SUM(${booking.price}), 0)::numeric`.mapWith(Number)
      })
      .from(booking)
      .where(
        and(
          eq(booking.serviceId, serviceId),
          sql`${booking.scheduledDate} >= ${sixMonthsAgo}`
        )
      )
      .groupBy(sql`to_char(${booking.scheduledDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${booking.scheduledDate}, 'YYYY-MM')`);

    return {
      service: serviceData[0],
      stats: {
        totalBookings,
        totalRevenue,
        statusBreakdown: statusBreakdownResult,
        monthlyTrends: monthlyTrendsResult
      },
      recentBookings,
      specialisingCleaners
    };
  } catch (err) {
    console.error("Error loading service details:", err);
    throw error(500, "Failed to load service details");
  }
};

export const actions: Actions = {
  // Action to toggle service availability
  toggleAvailability: async ({ params, locals }) => {
    if (!locals.user || locals.user.role !== "ADMIN") {
      throw error(403, "Unauthorized");
    }

    const serviceId = params.id;
    
    if (!serviceId) {
      throw error(400, "Service ID is required");
    }

    try {
      // First get the current service status
      const serviceData = await db
        .select({
          isActive: service.isActive
        })
        .from(service)
        .where(eq(service.id, serviceId))
        .limit(1);

      if (serviceData.length === 0) {
        throw error(404, "Service not found");
      }

      const currentStatus = serviceData[0].isActive;
      
      // Toggle the status
      await db
        .update(service)
        .set({
          isActive: !currentStatus,
          updatedAt: new Date()
        })
        .where(eq(service.id, serviceId));

      return {
        success: true,
        message: `Service ${currentStatus ? 'deactivated' : 'activated'} successfully`
      };
    } catch (err) {
      console.error("Error toggling service availability:", err);
      throw error(500, "Failed to update service");
    }
  }
};
