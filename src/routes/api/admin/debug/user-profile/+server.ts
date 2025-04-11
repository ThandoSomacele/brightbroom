// src/routes/api/admin/debug/user-profile/+server.ts
import { db } from "$lib/server/db";
import { cleanerProfile, user } from "$lib/server/db/schema";
import { error, json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

/**
 * Admin debug endpoint to check if a cleaner user has a profile
 * GET: Check if a user has a profile
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  // Ensure admin access
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw error(403, "Unauthorized access");
  }
  
  // Get userId from query parameter
  const userId = url.searchParams.get("userId");

  if (!userId) {
    throw error(400, "User ID is required");
  }

  try {
    // Get user details
    const users = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    // Get profile details
    const profiles = await db
      .select()
      .from(cleanerProfile)
      .where(eq(cleanerProfile.userId, userId))
      .limit(1);

    const hasProfile = profiles.length > 0;

    return json({
      user: users.length > 0 ? users[0] : null,
      hasProfile,
      profile: hasProfile ? profiles[0] : null,
    });
  } catch (err) {
    console.error("Error checking user profile:", err);
    throw error(500, "Failed to check user profile");
  }
};

/**
 * Admin debug endpoint to create a profile for a cleaner user that doesn't have one
 * POST: Create a profile for a user
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  // Ensure admin access
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw error(403, "Unauthorized access");
  }
  
  // Get userId from request body
  const body = await request.json();
  const userId = body.userId;

  if (!userId) {
    throw error(400, "User ID is required");
  }

  try {
    // Check if user exists and is a cleaner
    const users = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (users.length === 0) {
      throw error(404, "User not found");
    }

    const userData = users[0];

    if (userData.role !== "CLEANER") {
      throw error(400, "User is not a cleaner");
    }

    // Check if profile already exists
    const existingProfiles = await db
      .select()
      .from(cleanerProfile)
      .where(eq(cleanerProfile.userId, userId))
      .limit(1);

    if (existingProfiles.length > 0) {
      throw error(400, "Profile already exists for this user");
    }

    // Create new profile with default values
    const profileId = crypto.randomUUID();

    const [newProfile] = await db
      .insert(cleanerProfile)
      .values({
        id: profileId,
        userId,
        idType: "SOUTH_AFRICAN_ID",
        idNumber: "0000000000000", // Placeholder - admin should update this
        workLocationLat: -26.0274, // Default to Fourways
        workLocationLng: 28.0106,
        workAddress: "Fourways, Johannesburg", // Default address
        workRadius: 10, // Default radius in km
        petCompatibility: "NONE",
        availableDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
        isAvailable: false, // Start as unavailable until configured properly
        experienceTypes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return json({
      success: true,
      profile: newProfile,
      message: "Cleaner profile created successfully. Please update with accurate information."
    });
  } catch (err) {
    console.error("Error creating cleaner profile:", err);
    throw error(500, {
      message: err instanceof Error ? err.message : "Failed to create cleaner profile",
    });
  }
};
