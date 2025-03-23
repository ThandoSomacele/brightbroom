// src/routes/admin/users/[id]/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { user, address, booking, payment } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const userId = params.id;
  
  if (!userId) {
    throw error(404, 'User not found');
  }
  
  try {
    // Fetch the user details
    const userResults = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    
    if (userResults.length === 0) {
      throw error(404, 'User not found');
    }
    
    const userData = userResults[0];
    
    // Fetch user's addresses
    const userAddresses = await db.select()
      .from(address)
      .where(eq(address.userId, userId))
      .orderBy(desc(address.isDefault));
    
    // Fetch user's recent bookings
    const userBookings = await db.select({
      id: booking.id,
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      price: booking.price,
      createdAt: booking.createdAt
    })
    .from(booking)
    .where(eq(booking.userId, userId))
    .orderBy(desc(booking.createdAt))
    .limit(5);
    
    // Get stats
    // 1. Total amount spent
    const totalSpentResult = await db.select({
      totalSpent: db.fn.sum(payment.amount).mapWith(Number)
    })
    .from(payment)
    .where(
      eq(payment.userId, userId)
    );
    
    const totalSpent = totalSpentResult[0]?.totalSpent || 0;
    
    // 2. Total number of bookings
    const totalBookingsResult = await db.select({
      count: db.fn.count().mapWith(Number)
    })
    .from(booking)
    .where(eq(booking.userId, userId));
    
    const totalBookings = totalBookingsResult[0]?.count || 0;
    
    // 3. Recent activity (simplified for demo)
    const recentActivity = [
      {
        type: 'BOOKING',
        action: 'Created new booking',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
      },
      {
        type: 'PROFILE',
        action: 'Updated profile information',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) // 5 days ago
      },
      {
        type: 'ADDRESS',
        action: 'Added new address',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) // 7 days ago
      }
    ];
    
    return {
      user: {
        ...userData,
        passwordHash: undefined // Don't send the password hash to the client
      },
      addresses: userAddresses,
      bookings: userBookings,
      stats: {
        totalSpent,
        totalBookings,
        memberSince: new Date(userData.createdAt),
        lastActive: new Date() // Placeholder - in a real app, this would be tracked
      },
      recentActivity
    };
  } catch (err) {
    console.error('Error loading user details:', err);
    throw error(500, 'Error loading user details');
  }
};

export const actions: Actions = {
  // Action to update user information
  updateUser: async ({ request, params }) => {
    const userId = params.id;
    const formData = await request.formData();
    
    const firstName = formData.get('firstName')?.toString();
    const lastName = formData.get('lastName')?.toString();
    const phone = formData.get('phone')?.toString() || null;
    const role = formData.get('role')?.toString();
    
    if (!userId || !firstName || !lastName || !role) {
      return fail(400, {
        error: 'Missing required fields'
      });
    }
    
    try {
      // Update user data
      await db.update(user)
        .set({
          firstName,
          lastName,
          phone,
          role: role as any, // Type assertion to satisfy TypeScript
          updatedAt: new Date()
        })
        .where(eq(user.id, userId));
      
      return {
        success: true,
        message: 'User information updated successfully'
      };
    } catch (err) {
      console.error('Error updating user:', err);
      return fail(500, {
        error: 'Failed to update user information'
      });
    }
  }
};
