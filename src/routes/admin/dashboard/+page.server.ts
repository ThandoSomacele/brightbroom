// src/routes/admin/dashboard/+page.server.ts
import { db } from "$lib/server/db";
import { booking, payment, user, cleanerProfile, subscription, subscriptionPayment } from "$lib/server/db/schema";
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

// Recent activity: the latest bookings, completed payments (once-off and
// subscription cycles) and registrations, merged newest-first. Tenant admins
// see only their own company's bookings and payments; registrations are
// platform-level data and stay platform-only, matching /admin/users access.
async function getRecentActivity(tenantId: string | null) {
  const LIMIT = 8;

  try {
    const tenantFilter = bookingTenantCondition(tenantId);
    const fullName = (first: string | null, last: string | null) =>
      first ? `${first} ${last ?? ""}`.trim() : "Guest";
    const rand = (amount: string) => `R${Number(amount).toFixed(2)}`;

    const recentBookings = await db
      .select({
        id: booking.id,
        createdAt: booking.createdAt,
        firstName: user.firstName,
        lastName: user.lastName,
      })
      .from(booking)
      .leftJoin(user, eq(booking.userId, user.id))
      .where(tenantFilter)
      .orderBy(desc(booking.createdAt))
      .limit(LIMIT);

    const recentPayments = await db
      .select({
        bookingId: payment.bookingId,
        amount: payment.amount,
        createdAt: payment.createdAt,
        firstName: user.firstName,
        lastName: user.lastName,
      })
      .from(payment)
      .leftJoin(user, eq(payment.userId, user.id))
      .leftJoin(booking, eq(payment.bookingId, booking.id))
      .where(
        tenantFilter
          ? and(eq(payment.status, "COMPLETED"), tenantFilter)
          : eq(payment.status, "COMPLETED"),
      )
      .orderBy(desc(payment.createdAt))
      .limit(LIMIT);

    const recentCyclePayments = await db
      .select({
        bookingId: subscriptionPayment.bookingId,
        amount: subscriptionPayment.amount,
        createdAt: subscriptionPayment.createdAt,
        firstName: user.firstName,
        lastName: user.lastName,
      })
      .from(subscriptionPayment)
      .innerJoin(subscription, eq(subscriptionPayment.subscriptionId, subscription.id))
      .leftJoin(user, eq(subscription.userId, user.id))
      .leftJoin(booking, eq(subscriptionPayment.bookingId, booking.id))
      .where(
        tenantFilter
          ? and(eq(subscriptionPayment.status, "COMPLETED"), tenantFilter)
          : eq(subscriptionPayment.status, "COMPLETED"),
      )
      .orderBy(desc(subscriptionPayment.createdAt))
      .limit(LIMIT);

    const recentUsers = tenantId
      ? []
      : await db
          .select({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt,
          })
          .from(user)
          .orderBy(desc(user.createdAt))
          .limit(LIMIT);

    return [
      ...recentBookings.map((b) => ({
        type: "BOOKING",
        description: "Booking created",
        user: fullName(b.firstName, b.lastName),
        date: b.createdAt.toISOString(),
        link: `/admin/bookings/${b.id}`,
      })),
      ...recentPayments.map((p) => ({
        type: "PAYMENT",
        description: `Payment of ${rand(p.amount)} completed`,
        user: fullName(p.firstName, p.lastName),
        date: p.createdAt.toISOString(),
        link: p.bookingId ? `/admin/bookings/${p.bookingId}` : "/admin/bookings",
      })),
      ...recentCyclePayments.map((p) => ({
        type: "PAYMENT",
        description: `Subscription payment of ${rand(p.amount)}`,
        user: fullName(p.firstName, p.lastName),
        date: p.createdAt.toISOString(),
        link: p.bookingId ? `/admin/bookings/${p.bookingId}` : "/admin/bookings",
      })),
      ...recentUsers.map((u) => ({
        type: "USER",
        description: `New ${u.role.toLowerCase().replace("_", " ")} registered`,
        user: fullName(u.firstName, u.lastName),
        date: u.createdAt.toISOString(),
        link: `/admin/users/${u.id}`,
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, LIMIT);
  } catch (error) {
    console.error("Error loading recent activity:", error);
    return [];
  }
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
      recentActivity: getRecentActivity(tenantId),
    },
  };
};
