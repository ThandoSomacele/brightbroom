// src/routes/admin/reports/+page.server.ts
import { db } from "$lib/server/db";
import { booking, payment, bookingAddon, addon } from "$lib/server/db/schema";
import { redirect } from "@sveltejs/kit";
import { and, eq, gte, lt, sql, desc } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

// Helper function to fetch all report metrics
async function getReportMetrics(startDateObj: Date, endDateObj: Date, period: string) {
  // Fetch revenue metrics
  const revenueData = await getRevenueMetrics(
    startDateObj,
    endDateObj,
    period,
  );

  // Fetch booking metrics
  const bookingMetrics = await getBookingMetrics(startDateObj, endDateObj);

  // Fetch booking trend data
  const bookingTrend = await getBookingTrend(startDateObj, endDateObj);

  // Fetch booking insights (room configurations and addons)
  const bookingInsights = await getBookingInsights(startDateObj, endDateObj);

  // Fetch user growth data
  const userGrowth = await getUserGrowth(startDateObj, endDateObj, period);

  // Fetch cleaner performance data
  const cleanerPerformance = await getCleanerPerformance(
    startDateObj,
    endDateObj,
  );

  return {
    revenue: revenueData,
    bookings: bookingMetrics,
    bookingTrend,
    bookingInsights,
    userGrowth,
    cleanerPerformance,
  };
}

export const load: PageServerLoad = async ({ url, locals }) => {
  // Verify admin role
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw redirect(302, "/auth/login?redirectTo=/admin/reports");
  }

  // Get filter parameters from URL
  const period = url.searchParams.get("period") || "month";
  const startDate =
    url.searchParams.get("startDate") || getDefaultStartDate(period);
  const endDate = url.searchParams.get("endDate") || getCurrentDate();

  // Parse dates
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  // Set end date to end of day
  endDateObj.setHours(23, 59, 59, 999);

  return {
    period,
    dateRange: {
      startDate,
      endDate,
    },
    streamed: {
      metrics: getReportMetrics(startDateObj, endDateObj, period),
    },
  };
};

// Helper function to get default start date based on period
function getDefaultStartDate(period: string): string {
  const now = new Date();
  const date = new Date(now);

  switch (period) {
    case "week":
      date.setDate(date.getDate() - 7);
      break;
    case "month":
      date.setMonth(date.getMonth() - 1);
      break;
    case "quarter":
      date.setMonth(date.getMonth() - 3);
      break;
    case "year":
      date.setFullYear(date.getFullYear() - 1);
      break;
    default:
      date.setMonth(date.getMonth() - 1); // Default to last month
  }

  return date.toISOString().split("T")[0];
}

// Helper function to get current date in YYYY-MM-DD format
function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0];
}

// Get revenue metrics
async function getRevenueMetrics(
  startDate: Date,
  endDate: Date,
  period: string,
) {
  // Total revenue for the period
  const totalRevenueResult = await db
    .select({
      total: sql<string>`COALESCE(SUM(${payment.amount}), 0)`.mapWith(Number),
    })
    .from(payment)
    .where(
      and(
        eq(payment.status, "COMPLETED"),
        gte(payment.createdAt, startDate),
        lt(payment.createdAt, endDate),
      ),
    );

  const totalRevenue = totalRevenueResult[0]?.total || 0;

  // Calculate previous period for comparison
  const previousPeriodStart = new Date(startDate);
  const previousPeriodEnd = new Date(endDate);
  const durationMs = endDate.getTime() - startDate.getTime();

  previousPeriodStart.setTime(previousPeriodStart.getTime() - durationMs);
  previousPeriodEnd.setTime(previousPeriodEnd.getTime() - durationMs);

  // Get previous period revenue
  const previousRevenueResult = await db
    .select({
      total: sql<string>`COALESCE(SUM(${payment.amount}), 0)`.mapWith(Number),
    })
    .from(payment)
    .where(
      and(
        eq(payment.status, "COMPLETED"),
        gte(payment.createdAt, previousPeriodStart),
        lt(payment.createdAt, previousPeriodEnd),
      ),
    );

  const previousPeriodTotal = previousRevenueResult[0]?.total || 0;

  // Calculate percentage change
  const percentageChange =
    previousPeriodTotal === 0
      ? 100 // If previous was 0, show 100% increase
      : ((totalRevenue - previousPeriodTotal) / previousPeriodTotal) * 100;

  // Get revenue trend data
  const interval = getIntervalByPeriod(period);
  const trendData = await getRevenueTrend(startDate, endDate, interval);

  return {
    total: totalRevenue,
    trend: trendData,
    previousPeriodTotal,
    percentageChange,
  };
}

// Get revenue trend data
async function getRevenueTrend(
  startDate: Date,
  endDate: Date,
  interval: string,
) {
  // Query real revenue data grouped by date
  const results = await db
    .select({
      date: sql<string>`DATE(${payment.createdAt})`.mapWith(String),
      value: sql<string>`COALESCE(SUM(${payment.amount}), 0)`.mapWith(Number),
    })
    .from(payment)
    .where(
      and(
        eq(payment.status, "COMPLETED"),
        gte(payment.createdAt, startDate),
        lt(payment.createdAt, endDate),
      ),
    )
    .groupBy(sql`DATE(${payment.createdAt})`)
    .orderBy(sql`DATE(${payment.createdAt})`);

  // If no data, return empty array
  if (results.length === 0) {
    return [];
  }

  return results.map((r) => ({
    date: r.date,
    value: r.value,
  }));
}

// Get booking trend data
async function getBookingTrend(startDate: Date, endDate: Date) {
  const results = await db
    .select({
      date: sql<string>`DATE(${booking.createdAt})`.mapWith(String),
      value: sql<number>`count(*)`.mapWith(Number),
    })
    .from(booking)
    .where(
      and(
        gte(booking.createdAt, startDate),
        lt(booking.createdAt, endDate),
      ),
    )
    .groupBy(sql`DATE(${booking.createdAt})`)
    .orderBy(sql`DATE(${booking.createdAt})`);

  if (results.length === 0) {
    return [];
  }

  return results.map((r) => ({
    date: r.date,
    value: r.value,
  }));
}

// Get booking metrics - simplify with drizzle builder
async function getBookingMetrics(startDate: Date, endDate: Date) {
  // Total bookings
  const totalBookingsResult = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(booking)
    .where(
      and(gte(booking.createdAt, startDate), lt(booking.createdAt, endDate)),
    );

  const totalBookings = totalBookingsResult[0]?.count || 0;

  // Completed bookings
  const completedBookingsResult = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(booking)
    .where(
      and(
        eq(booking.status, "COMPLETED"),
        gte(booking.createdAt, startDate),
        lt(booking.createdAt, endDate),
      ),
    );

  const completedBookings = completedBookingsResult[0]?.count || 0;

  // Cancelled bookings
  const cancelledBookingsResult = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(booking)
    .where(
      and(
        eq(booking.status, "CANCELLED"),
        gte(booking.createdAt, startDate),
        lt(booking.createdAt, endDate),
      ),
    );

  const cancelledBookings = cancelledBookingsResult[0]?.count || 0;

  // Pending confirmation bookings
  const pendingBookingsResult = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(booking)
    .where(
      and(
        eq(booking.status, "PENDING"),
        gte(booking.createdAt, startDate),
        lt(booking.createdAt, endDate),
      ),
    );

  const pendingBookings = pendingBookingsResult[0]?.count || 0;

  // Calculate conversion rate (completed / total)
  const conversionRate =
    totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

  return {
    total: totalBookings,
    completed: completedBookings,
    cancelled: cancelledBookings,
    pendingConfirmation: pendingBookings,
    conversionRate,
  };
}

// Get booking insights (room configurations and addons)
async function getBookingInsights(startDate: Date, endDate: Date) {
  // Get popular room configurations
  const roomConfigsResult = await db
    .select({
      bedroomCount: booking.bedroomCount,
      bathroomCount: booking.bathroomCount,
      count: sql<number>`count(*)`.mapWith(Number),
      totalRevenue: sql<string>`COALESCE(SUM(${booking.price}), 0)`.mapWith(Number),
    })
    .from(booking)
    .where(
      and(
        gte(booking.createdAt, startDate),
        lt(booking.createdAt, endDate),
      ),
    )
    .groupBy(booking.bedroomCount, booking.bathroomCount)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const roomConfigurations = roomConfigsResult.map((config) => ({
    configuration: `${config.bedroomCount || 1} Bed, ${config.bathroomCount || 1} Bath`,
    bedroomCount: config.bedroomCount || 1,
    bathroomCount: config.bathroomCount || 1,
    bookingCount: config.count,
    totalRevenue: config.totalRevenue,
  }));

  // Get popular addons
  const addonsResult = await db
    .select({
      addonId: bookingAddon.addonId,
      addonName: addon.name,
      count: sql<number>`count(*)`.mapWith(Number),
      totalRevenue: sql<string>`COALESCE(SUM(${bookingAddon.priceAtBooking}), 0)`.mapWith(Number),
    })
    .from(bookingAddon)
    .innerJoin(addon, eq(bookingAddon.addonId, addon.id))
    .innerJoin(booking, eq(bookingAddon.bookingId, booking.id))
    .where(
      and(
        gte(booking.createdAt, startDate),
        lt(booking.createdAt, endDate),
      ),
    )
    .groupBy(bookingAddon.addonId, addon.name)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const popularAddons = addonsResult.map((item) => ({
    addonId: item.addonId,
    addonName: item.addonName,
    bookingCount: item.count,
    totalRevenue: item.totalRevenue,
  }));

  // Get average duration and price
  const averagesResult = await db
    .select({
      avgDuration: sql<string>`COALESCE(AVG(${booking.duration}), 0)`.mapWith(Number),
      avgPrice: sql<string>`COALESCE(AVG(${booking.price}), 0)`.mapWith(Number),
    })
    .from(booking)
    .where(
      and(
        gte(booking.createdAt, startDate),
        lt(booking.createdAt, endDate),
      ),
    );

  return {
    roomConfigurations,
    popularAddons,
    averageDuration: Math.round(averagesResult[0]?.avgDuration || 0),
    averagePrice: averagesResult[0]?.avgPrice || 0,
  };
}

// Get user growth data
async function getUserGrowth(startDate: Date, endDate: Date, period: string) {
  // Mock data for development
  const dataPoints = 6;

  // Create customer growth data
  const customerData = [];
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i * 5);
    // Random value between 5 and 20
    const value = Math.floor(Math.random() * 15) + 5;
    customerData.push({ date: date.toISOString(), value });
  }

  // Create cleaner growth data
  const cleanerData = [];
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i * 5);
    // Random value between 1 and 10
    const value = Math.floor(Math.random() * 9) + 1;
    cleanerData.push({ date: date.toISOString(), value });
  }

  return {
    customers: customerData,
    cleaners: cleanerData,
  };
}

// Get cleaner performance data
async function getCleanerPerformance(startDate: Date, endDate: Date) {
  // Mock data for development
  return [
    {
      cleanerId: "c1",
      cleanerName: "John Davis",
      completedBookings: 24,
      averageBookingValue: 350,
    },
    {
      cleanerId: "c2",
      cleanerName: "Maria Lopez",
      completedBookings: 19,
      averageBookingValue: 380,
    },
    {
      cleanerId: "c3",
      cleanerName: "Sam Johnson",
      completedBookings: 17,
      averageBookingValue: 410,
    },
    {
      cleanerId: "c4",
      cleanerName: "Priya Patel",
      completedBookings: 15,
      averageBookingValue: 325,
    },
    {
      cleanerId: "c5",
      cleanerName: "David Chen",
      completedBookings: 12,
      averageBookingValue: 365,
    },
  ];
}

// Helper function to get the appropriate SQL interval based on period
function getIntervalByPeriod(period: string): string {
  switch (period) {
    case "week":
      return "day";
    case "month":
      return "day";
    case "quarter":
      return "week";
    case "year":
      return "month";
    default:
      return "day";
  }
}
