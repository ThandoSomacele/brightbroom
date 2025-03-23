// src/routes/admin/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { booking, payment, user } from '$lib/server/db/schema';
import { eq, and, gte, lt, sql, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  // Current date and time
  const now = new Date();
  
  // Calculate date ranges for trends
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  
  try {
    // Count total bookings
    const totalBookingsResult = await db.select({
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(booking);
    const totalBookings = totalBookingsResult[0]?.count || 0;
    
    // Count current month bookings
    const currentMonthBookingsResult = await db.select({
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(booking)
    .where(gte(booking.createdAt, currentMonthStart));
    const currentMonthBookings = currentMonthBookingsResult[0]?.count || 0;
    
    // Count last month bookings
    const lastMonthBookingsResult = await db.select({
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(booking)
    .where(
      and(
        gte(booking.createdAt, lastMonthStart),
        lt(booking.createdAt, currentMonthStart)
      )
    );
    const lastMonthBookings = lastMonthBookingsResult[0]?.count || 0;
    
    // Calculate booking trend percentage
    const bookingTrend = lastMonthBookings === 0 
      ? 100 // If last month had 0 bookings, show 100% increase
      : Number((((currentMonthBookings - lastMonthBookings) / lastMonthBookings) * 100).toFixed(1));
    
    // Calculate total revenue
    const totalRevenueResult = await db.select({
      sum: sql<string>`sum(amount)::numeric`.mapWith(Number)
    })
    .from(payment)
    .where(eq(payment.status, 'COMPLETED'));
    const totalRevenue = totalRevenueResult[0]?.sum || 0;
    
    // Calculate current month revenue
    const currentMonthRevenueResult = await db.select({
      sum: sql<string>`sum(amount)::numeric`.mapWith(Number)
    })
    .from(payment)
    .where(
      and(
        eq(payment.status, 'COMPLETED'),
        gte(payment.createdAt, currentMonthStart)
      )
    );
    const currentMonthRevenue = currentMonthRevenueResult[0]?.sum || 0;
    
    // Calculate last month revenue
    const lastMonthRevenueResult = await db.select({
      sum: sql<string>`sum(amount)::numeric`.mapWith(Number)
    })
    .from(payment)
    .where(
      and(
        eq(payment.status, 'COMPLETED'),
        gte(payment.createdAt, lastMonthStart),
        lt(payment.createdAt, currentMonthStart)
      )
    );
    const lastMonthRevenue = lastMonthRevenueResult[0]?.sum || 0;
    
    // Calculate revenue trend percentage
    const revenueTrend = lastMonthRevenue === 0 
      ? 100 // If last month had 0 revenue, show 100% increase
      : Number((((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1));
    
    // Count active cleaners
    const activeCleanersResult = await db.select({
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(user)
    .where(eq(user.role, 'CLEANER'));
    const activeCleaners = activeCleanersResult[0]?.count || 0;
    
    // Count cleaners joined this month
    const newCleanersResult = await db.select({
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(user)
    .where(
      and(
        eq(user.role, 'CLEANER'),
        gte(user.createdAt, currentMonthStart)
      )
    );
    const newCleaners = newCleanersResult[0]?.count || 0;
    
    // Count cleaners joined last month
    const lastMonthCleanersResult = await db.select({
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(user)
    .where(
      and(
        eq(user.role, 'CLEANER'),
        gte(user.createdAt, lastMonthStart),
        lt(user.createdAt, currentMonthStart)
      )
    );
    const lastMonthCleaners = lastMonthCleanersResult[0]?.count || 0;
    
    // Calculate cleaner trend percentage
    const cleanerTrend = lastMonthCleaners === 0 
      ? 100 // If last month had 0 new cleaners, show 100% increase
      : Number((((newCleaners - lastMonthCleaners) / lastMonthCleaners) * 100).toFixed(1));
    
    // Count pending bookings
    const pendingBookingsResult = await db.select({
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(booking)
    .where(eq(booking.status, 'PENDING'));
    const pendingBookings = pendingBookingsResult[0]?.count || 0;
    
    // Create mock data for recent activity (in a real app, this would come from a real activity log)
    const recentActivity = [
      {
        type: 'BOOKING',
        description: 'New booking created',
        user: 'Sarah Johnson',
        date: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        link: '/admin/bookings/123'
      },
      {
        type: 'PAYMENT',
        description: 'Payment completed',
        user: 'John Smith',
        date: new Date(now.getTime() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        link: '/admin/bookings/456'
      },
      {
        type: 'USER',
        description: 'New user registered',
        user: 'Emma Wilson',
        date: new Date(now.getTime() - 1000 * 60 * 180).toISOString(), // 3 hours ago
        link: '/admin/users/789'
      },
      {
        type: 'BOOKING',
        description: 'Booking completed',
        user: 'Michael Brown',
        date: new Date(now.getTime() - 1000 * 60 * 240).toISOString(), // 4 hours ago
        link: '/admin/bookings/012'
      }
    ];
    
    // Return all data
    return {
      metrics: {
        totalBookings,
        totalRevenue,
        activeCleaners,
        pendingBookings,
        bookingTrend,
        revenueTrend,
        cleanerTrend
      },
      bookingTrends: [], // This would be data for charts in a real app
      revenueTrends: [], // This would be data for charts in a real app
      recentActivity
    };
  } catch (error) {
    console.error('Error loading admin dashboard data:', error);
    return {
      metrics: {
        totalBookings: 0,
        totalRevenue: 0,
        activeCleaners: 0,
        pendingBookings: 0,
        bookingTrend: 0,
        revenueTrend: 0,
        cleanerTrend: 0
      },
      bookingTrends: [],
      revenueTrends: [],
      recentActivity: []
    };
  }
};
