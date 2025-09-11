import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user, cleanerProfile } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const date = url.searchParams.get('date');
    const serviceId = url.searchParams.get('serviceId');
    
    // Base query to get cleaners with profiles (excluding private information)
    const cleanersQuery = db
      .select({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        // Removed email and phone for privacy
        profileId: cleanerProfile.id,
        bio: cleanerProfile.bio,
        rating: cleanerProfile.rating,
        petCompatibility: cleanerProfile.petCompatibility,
        experienceTypes: cleanerProfile.experienceTypes,
        profileImageUrl: cleanerProfile.profileImageUrl,
        workRadius: cleanerProfile.workRadius,
        workLocationLat: cleanerProfile.workLocationLat,
        workLocationLng: cleanerProfile.workLocationLng,
        distance: lat && lng
          ? sql<number>`
              6371 * acos(
                cos(radians(${lat})) * 
                cos(radians(${cleanerProfile.workLocationLat})) * 
                cos(radians(${cleanerProfile.workLocationLng}) - radians(${lng})) + 
                sin(radians(${lat})) * 
                sin(radians(${cleanerProfile.workLocationLat}))
              )`
          : sql<number>`0`,
      })
      .from(user)
      .innerJoin(cleanerProfile, eq(cleanerProfile.userId, user.id))
      .where(
        and(
          eq(user.role, 'CLEANER'),
          eq(user.isActive, true),
          eq(cleanerProfile.isAvailable, true)
        )
      );

    let cleaners = await cleanersQuery;
    
    console.log(`Found ${cleaners.length} cleaners in database with profiles`);

    // Filter by distance if location provided
    if (lat && lng) {
      cleaners = cleaners.filter(cleaner => {
        const distance = cleaner.distance || 0;
        const radius = Number(cleaner.workRadius) || 20;
        return distance <= radius;
      });
    }

    // Sort by rating (if available) and distance
    cleaners.sort((a, b) => {
      // First sort by rating (higher rating first)
      const ratingA = Number(a.rating) || 0;
      const ratingB = Number(b.rating) || 0;
      if (ratingA !== ratingB) {
        return ratingB - ratingA;
      }
      
      // Then sort by distance (closer first)
      return (a.distance || 0) - (b.distance || 0);
    });

    // Return top 3 cleaners
    const topCleaners = cleaners.slice(0, 3);

    // Format the response
    const formattedCleaners = topCleaners.map(cleaner => ({
      id: cleaner.id,
      name: `${cleaner.firstName} ${cleaner.lastName}`,
      firstName: cleaner.firstName,
      lastName: cleaner.lastName,
      bio: cleaner.bio || 'Experienced professional cleaner',
      rating: cleaner.rating ? Number(cleaner.rating) : null,
      profileImageUrl: cleaner.profileImageUrl || '/images/default-avatar.svg',
      petCompatibility: cleaner.petCompatibility,
      experienceTypes: cleaner.experienceTypes || [],
      distance: cleaner.distance ? Math.round(cleaner.distance * 10) / 10 : null,
    }));

    return json({
      success: true,
      cleaners: formattedCleaners,
    });
  } catch (error) {
    console.error('Error fetching available cleaners:', error);
    return json({
      success: false,
      error: 'Failed to fetch available cleaners',
      cleaners: [],
    }, { status: 500 });
  }
};