// src/routes/admin/dashboard/+page.server.ts
import { db } from "$lib/server/db";
import { booking, payment, user, cleanerProfile } from "$lib/server/db/schema";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

// Helper to build tenant-scoped booking conditions
function bookingTenantCondition(tenantId: string | null): SQL | undefined {
  return tenantId ? eq(booking.tenantId, tenantId) : undefined;
}

// Helper to build tenant-scoped cleaner conditions
function cleanerTenantCondition(tenantId: string | null): SQL | undefined {
  return tenantId ? eq(cleanerProfile.tenantId, tenantId) : undefined;
}

// Helper function to get metrics data
async function getMetrics(tenantId: string | null) {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const tenantFilter = bookingTenantCondition(tenantId);

  try {
    // Count total bookings
    const totalBookingsResult = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(booking)
      .where(tenantFilter);
    const totalBookings = totalBookingsResult[0]?.count || 0;

    // Count current month bookings
    const currentMonthBookingsResult = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(booking)
      .where(tenantFilter ? and(gte(booking.createdAt, currentMonthStart), tenantFilter) : gte(booking.createdAt, currentMonthStart));
    const currentMonthBookings = currentMonthBookingsResult[0]?.count || 0;

    // Count last month bookings
    const lastMonthBookingsResult = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(booking)
      .where(
        tenantFilter
          ? and(gte(booking.createdAt, lastMonthStart), lt(booking.createdAt, currentMonthStart), tenantFilter)
          : and(gte(booking.createdAt, lastMonthStart), lt(booking.createdAt, currentMonthStart))
      );
    const lastMonthBookings = lastMonthBookingsResult[0]?.count || 0;

    const bookingTrend =
      lastMonthBookings === 0
        ? 100
        : Number(
            (((currentMonthBookings - lastMonthBookings) / lastMonthBookings) * 100).toFixed(1),
          );

    // Revenue - join payment with booking for tenant filtering
    const revenueBase = tenantFilter
      ? db.select({ sum: sql<string>`sum(${payment.amount})::numeric`.mapWith(Number) })
          .from(payment)
          .innerJoin(booking, eq(booking.id, payment.bookingId))
          .where(and(eq(payment.status, "COMPLETED"), tenantFilter))
      : db.select({ sum: sql<string>`sum(${payment.amount})::numeric`.mapWith(Number) })
          .from(payment)
          .where(eq(payment.status, "COMPLETED"));

    const totalRevenueResult = await revenueBase;
    const totalRevenue = totalRevenueResult[0]?.sum || 0;

    const currentMonthRevenueResult = tenantFilter
      ? await db.select({ sum: sql<string>`sum(${payment.amount})::numeric`.mapWith(Number) })
          .from(payment)
          .innerJoin(booking, eq(booking.id, payment.bookingId))
          .where(and(eq(payment.status, "COMPLETED"), gte(payment.createdAt, currentMonthStart), tenantFilter))
      : await db.select({ sum: sql<string>`sum(${payment.amount})::numeric`.mapWith(Number) })
          .from(payment)
          .where(and(eq(payment.status, "COMPLETED"), gte(payment.createdAt, currentMonthStart)));
    const currentMonthRevenue = currentMonthRevenueResult[0]?.sum || 0;

    const lastMonthRevenueResult = tenantFilter
      ? await db.select({ sum: sql<string>`sum(${payment.amount})::numeric`.mapWith(Number) })
          .from(payment)
          .innerJoin(booking, eq(booking.id, payment.bookingId))
          .where(and(eq(payment.status, "COMPLETED"), gte(payment.createdAt, lastMonthStart), lt(payment.createdAt, currentMonthStart), tenantFilter))
      : await db.select({ sum: sql<string>`sum(${payment.amount})::numeric`.mapWith(Number) })
          .from(payment)
          .where(and(eq(payment.status, "COMPLETED"), gte(payment.createdAt, lastMonthStart), lt(payment.createdAt, currentMonthStart)));
    const lastMonthRevenue = lastMonthRevenueResult[0]?.sum || 0;

    const revenueTrend =
      lastMonthRevenue === 0
        ? 100
        : Number((((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1));

    // Active cleaners - scope by tenant
    const cleanerFilter = cleanerTenantCondition(tenantId);
    const activeCleanersResult = cleanerFilter
      ? await db.select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(user)
          .innerJoin(cleanerProfile, eq(user.id, cleanerProfile.userId))
          .where(and(eq(user.role, "CLEANER"), cleanerFilter))
      : await db.select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(user)
          .where(eq(user.role, "CLEANER"));
    const activeCleaners = activeCleanersResult[0]?.count || 0;

    const newCleanersResult = cleanerFilter
      ? await db.select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(user)
          .innerJoin(cleanerProfile, eq(user.id, cleanerProfile.userId))
          .where(and(eq(user.role, "CLEANER"), gte(user.createdAt, currentMonthStart), cleanerFilter))
      : await db.select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(user)
          .where(and(eq(user.role, "CLEANER"), gte(user.createdAt, currentMonthStart)));
    const newCleaners = newCleanersResult[0]?.count || 0;

    const lastMonthCleanersResult = cleanerFilter
      ? await db.select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(user)
          .innerJoin(cleanerProfile, eq(user.id, cleanerProfile.userId))
          .where(and(eq(user.role, "CLEANER"), gte(user.createdAt, lastMonthStart), lt(user.createdAt, currentMonthStart), cleanerFilter))
      : await db.select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(user)
          .where(and(eq(user.role, "CLEANER"), gte(user.createdAt, lastMonthStart), lt(user.createdAt, currentMonthStart)));
    const lastMonthCleaners = lastMonthCleanersResult[0]?.count || 0;

    const cleanerTrend =
      lastMonthCleaners === 0
        ? 100
        : Number((((newCleaners - lastMonthCleaners) / lastMonthCleaners) * 100).toFixed(1));

    // Pending bookings
    const pendingBookingsResult = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(booking)
      .where(tenantFilter ? and(eq(booking.status, "PENDING"), tenantFilter) : eq(booking.status, "PENDING"));
    const pendingBookings = pendingBookingsResult[0]?.count || 0;

    return {
      totalBookings,
      totalRevenue,
      activeCleaners,
      pendingBookings,
      bookingTrend,
      revenueTrend,
      cleanerTrend,
    };
  } catch (error) {
    console.error("Error loading metrics:", error);
    return {
      totalBookings: 0,
      totalRevenue: 0,
      activeCleaners: 0,
      pendingBookings: 0,
      bookingTrend: 0,
      revenueTrend: 0,
      cleanerTrend: 0,
    };
  }
}

// Helper function to get pending cleaners
async function getPendingCleaners(tenantId: string | null) {
  try {
    const cleanerFilter = cleanerTenantCondition(tenantId);
    const conditions: SQL[] = [eq(user.role, "CLEANER"), eq(cleanerProfile.isAvailable, false)];
    if (cleanerFilter) conditions.push(cleanerFilter);

    return await db
      .select({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        createdAt: user.createdAt,
      })
      .from(user)
      .innerJoin(cleanerProfile, eq(user.id, cleanerProfile.userId))
      .where(and(...conditions))
      .orderBy(desc(user.createdAt))
      .limit(5);
  } catch (error) {
    console.error("Error loading pending cleaners:", error);
    return [];
  }
}

// Helper function to get booking trends
async function getBookingTrends(tenantId: string | null) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const tenantFilter = bookingTenantCondition(tenantId);

  try {
    const bookingTrendsResult = await db
      .select({
        date: sql<string>`DATE(${booking.createdAt})`.mapWith(String),
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(booking)
      .where(tenantFilter ? and(gte(booking.createdAt, thirtyDaysAgo), tenantFilter) : gte(booking.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${booking.createdAt})`)
      .orderBy(sql`DATE(${booking.createdAt})`);

    return bookingTrendsResult.map((r) => ({ date: r.date, value: r.count }));
  } catch (error) {
    console.error("Error loading booking trends:", error);
    return [];
  }
}

// Helper function to get revenue trends
async function getRevenueTrends(tenantId: string | null) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const tenantFilter = bookingTenantCondition(tenantId);

  try {
    let query;
    if (tenantFilter) {
      query = db
        .select({
          date: sql<string>`DATE(${payment.createdAt})`.mapWith(String),
          value: sql<string>`COALESCE(SUM(${payment.amount}), 0)`.mapWith(Number),
        })
        .from(payment)
        .innerJoin(booking, eq(booking.id, payment.bookingId))
        .where(and(eq(payment.status, "COMPLETED"), gte(payment.createdAt, thirtyDaysAgo), tenantFilter))
        .groupBy(sql`DATE(${payment.createdAt})`)
        .orderBy(sql`DATE(${payment.createdAt})`);
    } else {
      query = db
        .select({
          date: sql<string>`DATE(${payment.createdAt})`.mapWith(String),
          value: sql<string>`COALESCE(SUM(${payment.amount}), 0)`.mapWith(Number),
        })
        .from(payment)
        .where(and(eq(payment.status, "COMPLETED"), gte(payment.createdAt, thirtyDaysAgo)))
        .groupBy(sql`DATE(${payment.createdAt})`)
        .orderBy(sql`DATE(${payment.createdAt})`);
    }

    const result = await query;
    return result.map((r) => ({ date: r.date, value: r.value }));
  } catch (error) {
    console.error("Error loading revenue trends:", error);
    return [];
  }
}

// Helper function to get recent activity
async function getRecentActivity() {
  const now = new Date();
  return [
    {
      type: "BOOKING",
      description: "New booking created",
      user: "Sarah Johnson",
      date: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      link: "/admin/bookings/123",
    },
    {
      type: "PAYMENT",
      description: "Payment completed",
      user: "John Smith",
      date: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
      link: "/admin/bookings/456",
    },
    {
      type: "USER",
      description: "New user registered",
      user: "Emma Wilson",
      date: new Date(now.getTime() - 1000 * 60 * 180).toISOString(),
      link: "/admin/users/789",
    },
    {
      type: "BOOKING",
      description: "Booking completed",
      user: "Michael Brown",
      date: new Date(now.getTime() - 1000 * 60 * 240).toISOString(),
      link: "/admin/bookings/012",
    },
  ];
}

export const load: PageServerLoad = async ({ locals }) => {
  // Tenant scoping
  const tenantId = locals.user?.role === 'TENANT_ADMIN' ? locals.tenant?.id || null : null;

  return {
    streamed: {
      metrics: getMetrics(tenantId),
      pendingCleaners: getPendingCleaners(tenantId),
      bookingTrends: getBookingTrends(tenantId),
      revenueTrends: getRevenueTrends(tenantId),
      recentActivity: getRecentActivity(),
    },
  };
};
