// src/routes/admin/reports/+page.server.ts
import { db } from "$lib/server/db";
import { booking, payment } from "$lib/server/db/schema";
import { redirect } from "@sveltejs/kit";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

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

  try {
    // Fetch revenue metrics
    const revenueData = await getRevenueMetrics(
      startDateObj,
      endDateObj,
      period,
    );

    // Fetch booking metrics
    const bookingMetrics = await getBookingMetrics(startDateObj, endDateObj);

    // Fetch top services
    const topServices = await getTopServices(startDateObj, endDateObj);

    // Fetch user growth data
    const userGrowth = await getUserGrowth(startDateObj, endDateObj, period);

    // Fetch cleaner performance data
    const cleanerPerformance = await getCleanerPerformance(
      startDateObj,
      endDateObj,
    );

    // Combine all data and return
    return {
      period,
      dateRange: {
        startDate,
        endDate,
      },
      metrics: {
        revenue: revenueData,
        bookings: bookingMetrics,
        topServices,
        userGrowth,
        cleanerPerformance,
      },
    };
  } catch (error) {
    console.error("Error loading report data:", error);
    return {
      error: "Failed to load report data",
      period,
      dateRange: {
        startDate,
        endDate,
      },
      metrics: {
        revenue: {
          total: 0,
          trend: [],
          previousPeriodTotal: 0,
          percentageChange: 0,
        },
        bookings: {
          total: 0,
          completed: 0,
          cancelled: 0,
          pendingConfirmation: 0,
          conversionRate: 0,
        },
        topServices: [],
        userGrowth: {
          customers: [],
          cleaners: [],
        },
        cleanerPerformance: [],
      },
    };
  }
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
  // For simplicity during development, return mock data
  // In a production environment, you would use a more sophisticated query

  // Sample data with 7 data points
  const dataPoints = 7;
  const step = (endDate.getTime() - startDate.getTime()) / (dataPoints - 1);

  const mockData = [];
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date(startDate.getTime() + step * i);
    // Random value between 1000 and 5000
    const value = Math.floor(Math.random() * 4000) + 1000;
    mockData.push({ date: date.toISOString(), value });
  }

  return mockData;
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

// Get top services
async function getTopServices(startDate: Date, endDate: Date) {
  // Using a simplified approach for development
  // Mock data for top services
  return [
    {
      serviceId: "1",
      serviceName: "Regular Cleaning",
      bookingCount: 42,
      totalRevenue: 14700,
    },
    {
      serviceId: "2",
      serviceName: "Extended Cleaning",
      bookingCount: 28,
      totalRevenue: 15400,
    },
    {
      serviceId: "3",
      serviceName: "Office Cleaning",
      bookingCount: 21,
      totalRevenue: 9450,
    },
    {
      serviceId: "4",
      serviceName: "Move-in/Move-out",
      bookingCount: 15,
      totalRevenue: 8250,
    },
    {
      serviceId: "5",
      serviceName: "Post Construction",
      bookingCount: 8,
      totalRevenue: 5600,
    },
  ];
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
