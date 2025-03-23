// src/routes/admin/cleaners/[id]/+page.server.ts
import { db } from "$lib/server/db";
import { 
  user, 
  cleanerProfile, 
  cleanerSpecialization, 
  service,
  booking
} from "$lib/server/db/schema";
import { error, fail } from "@sveltejs/kit";
import { eq, and, desc } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const cleanerId = params.id;
  
  if (!cleanerId) {
    throw error(404, "Cleaner not found");
  }
  
  try {
    // Fetch the cleaner with profile data
    const userResults = await db
      .select()
      .from(user)
      .where(and(
        eq(user.id, cleanerId),
        eq(user.role, "CLEANER")
      ))
      .limit(1);
    
    if (userResults.length === 0) {
      throw error(404, "Cleaner not found");
    }
    
    const cleanerData = userResults[0];
    
    // Fetch cleaner profile
    const profileResults = await db
      .select()
      .from(cleanerProfile)
      .where(eq(cleanerProfile.userId, cleanerId))
      .limit(1);
    
    const profile = profileResults.length > 0 ? profileResults[0] : null;
    
    // Fetch specializations
    let specializations = [];
    if (profile) {
      specializations = await db
        .select({
          id: cleanerSpecialization.id,
          serviceId: cleanerSpecialization.serviceId,
          cleanerProfileId: cleanerSpecialization.cleanerProfileId,
          experience: cleanerSpecialization.experience
        })
        .from(cleanerSpecialization)
        .where(eq(cleanerSpecialization.cleanerProfileId, profile.id));
    }
    
    // Fetch all services for dropdown options
    const services = await db
      .select()
      .from(service);
    
    // Fetch recent bookings
    const recentBookings = await db
      .select({
        id: booking.id,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        customer: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName
        }
      })
      .from(booking)
      .innerJoin(user, eq(booking.userId, user.id))
      .where(eq(booking.cleanerId, cleanerId))
      .orderBy(desc(booking.scheduledDate))
      .limit(5);
    
    // Combine data
    return {
      cleaner: {
        ...cleanerData,
        cleanerProfile: profile,
        specializations
      },
      services,
      bookings: recentBookings
    };
  } catch (err) {
    console.error('Error loading cleaner details:', err);
    throw error(500, "Error loading cleaner details");
  }
};

export const actions: Actions = {
  // Update personal information
  updatePersonalInfo: async ({ params, request }) => {
    const cleanerId = params.id;
    
    if (!cleanerId) {
      return fail(400, { error: "Cleaner ID is required" });
    }
    
    const formData = await request.formData();
    const firstName = formData.get('firstName')?.toString();
    const lastName = formData.get('lastName')?.toString();
    const phone = formData.get('phone')?.toString() || null;
    
    if (!firstName || !lastName) {
      return fail(400, { error: "First name and last name are required" });
    }
    
    try {
      // Update user data
      await db
        .update(user)
        .set({
          firstName,
          lastName,
          phone,
          updatedAt: new Date()
        })
        .where(eq(user.id, cleanerId));
      
      return {
        success: true,
        message: "Personal information updated successfully"
      };
    } catch (err) {
      console.error('Error updating personal info:', err);
      return fail(500, { error: "Failed to update personal information" });
    }
  },
  
  // Update cleaner profile
  updateProfile: async ({ params, request }) => {
    const cleanerId = params.id;
    
    if (!cleanerId) {
      return fail(400, { error: "Cleaner ID is required" });
    }
    
    const formData = await request.formData();
    const workAddress = formData.get('workAddress')?.toString();
    const workRadius = formData.get('workRadius') ? parseFloat(formData.get('workRadius')?.toString() || "0") : 0;
    const bio = formData.get('bio')?.toString() || null;
    const petCompatibility = formData.get('petCompatibility')?.toString() || "NONE";
    const isAvailable = formData.has('isAvailable');
    const idType = formData.get('idType')?.toString() || "SOUTH_AFRICAN_ID";
    const idNumber = formData.get('idNumber')?.toString();
    const taxNumber = formData.get('taxNumber')?.toString() || null;
    
    // Parse available days from JSON string
    let availableDays: string[] = [];
    try {
      const availableDaysJson = formData.get('availableDays')?.toString();
      if (availableDaysJson) {
        availableDays = JSON.parse(availableDaysJson);
      }
    } catch (e) {
      console.error('Error parsing available days:', e);
    }
    
    if (!workAddress || !idNumber) {
      return fail(400, { error: "Work address and ID number are required" });
    }
    
    try {
      // Check if cleaner profile exists
      const profileResults = await db
        .select()
        .from(cleanerProfile)
        .where(eq(cleanerProfile.userId, cleanerId))
        .limit(1);
      
      const profileExists = profileResults.length > 0;
      
      if (profileExists) {
        // Update existing profile
        await db
          .update(cleanerProfile)
          .set({
            workAddress,
            workRadius,
            bio,
            petCompatibility: petCompatibility as any, // Type assertion
            isAvailable,
            idType: idType as any, // Type assertion
            idNumber,
            taxNumber,
            availableDays,
            updatedAt: new Date()
          })
          .where(eq(cleanerProfile.userId, cleanerId));
      } else {
        // Create new profile
        await db
          .insert(cleanerProfile)
          .values({
            id: crypto.randomUUID(),
            userId: cleanerId,
            workAddress,
            workRadius,
            bio,
            petCompatibility: petCompatibility as any, // Type assertion
            isAvailable,
            idType: idType as any, // Type assertion
            idNumber,
            taxNumber,
            availableDays,
            workLocationLat: 0, // Placeholder - would be set with actual geocoding
            workLocationLng: 0, // Placeholder - would be set with actual geocoding
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }
      
      return {
        success: true,
        message: "Cleaner profile updated successfully"
      };
    } catch (err) {
      console.error('Error updating cleaner profile:', err);
      return fail(500, { error: "Failed to update cleaner profile" });
    }
  },
  
  // Update specializations
  updateSpecializations: async ({ params, request }) => {
    const cleanerId = params.id;
    
    if (!cleanerId) {
      return fail(400, { error: "Cleaner ID is required" });
    }
    
    const formData = await request.formData();
    let specializations: { serviceId: string; experience: number }[] = [];
    
    try {
      const specializationsJson = formData.get('specializations')?.toString();
      if (specializationsJson) {
        specializations = JSON.parse(specializationsJson);
      }
    } catch (e) {
      console.error('Error parsing specializations:', e);
      return fail(400, { error: "Invalid specializations data" });
    }
    
    try {
      // Get cleaner profile ID
      const profileResults = await db
        .select()
        .from(cleanerProfile)
        .where(eq(cleanerProfile.userId, cleanerId))
        .limit(1);
      
      if (profileResults.length === 0) {
        return fail(400, { error: "Cleaner profile not found. Please save profile details first." });
      }
      
      const profileId = profileResults[0].id;
      
      // First, delete all existing specializations
      await db
        .delete(cleanerSpecialization)
        .where(eq(cleanerSpecialization.cleanerProfileId, profileId));
      
      // Then, add the new ones
      if (specializations.length > 0) {
        const specializationsToInsert = specializations.map(spec => ({
          id: crypto.randomUUID(),
          cleanerProfileId: profileId,
          serviceId: spec.serviceId,
          experience: spec.experience
        }));
        
        await db
          .insert(cleanerSpecialization)
          .values(specializationsToInsert);
      }
      
      return {
        success: true,
        message: "Specializations updated successfully"
      };
    } catch (err) {
      console.error('Error updating specializations:', err);
      return fail(500, { error: "Failed to update specializations" });
    }
  }
};
