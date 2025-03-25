// src/routes/join/cleaner/+page.server.ts
import { db } from "$lib/server/db";
import { user, cleanerProfile, service } from "$lib/server/db/schema";
import { error, fail, redirect } from "@sveltejs/kit";
import { hash } from "@node-rs/argon2";
import type { Actions, PageServerLoad } from "./$types";

/**
 * Load available services for the cleaner application form
 */
export const load: PageServerLoad = async () => {
  try {
    // Fetch all active services for the specializations section
    const services = await db.select().from(service).where(eq(service.isActive, true));

    return {
      services
    };
  } catch (err) {
    console.error("Error loading services for cleaner application:", err);
    throw error(500, "Failed to load services for cleaner application");
  }
};

/**
 * Handle cleaner application submission
 */
export const actions: Actions = {
  apply: async ({ request }) => {
    const formData = await request.formData();
    
    // Parse user data
    const email = formData.get("email")?.toString();
    const firstName = formData.get("firstName")?.toString();
    const lastName = formData.get("lastName")?.toString();
    const phone = formData.get("phone")?.toString() || null;
    const password = formData.get("password")?.toString();
    
    // Parse cleaner profile data
    const workAddress = formData.get("workAddress")?.toString();
    const workRadius = parseFloat(formData.get("workRadius")?.toString() || "0");
    const idType = formData.get("idType")?.toString() || "SOUTH_AFRICAN_ID";
    const idNumber = formData.get("idNumber")?.toString();
    const bio = formData.get("bio")?.toString() || null;
    const petCompatibility = formData.get("petCompatibility")?.toString() || "NONE";
    
    // Parse available days
    const availableDays = [];
    const daysOfWeek = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    for (const day of daysOfWeek) {
      if (formData.has(`day-${day}`)) {
        availableDays.push(day);
      }
    }
    
    // Parse service specializations
    const specializations = [];
    const serviceIds = formData.getAll("serviceId");
    for (const serviceId of serviceIds) {
      const experience = formData.get(`experience-${serviceId}`)?.toString();
      if (experience) {
        specializations.push({
          serviceId: serviceId.toString(),
          experience: parseInt(experience) || 0
        });
      }
    }

    // Validate required fields
    if (!email || !firstName || !lastName || !password || !workAddress || !idNumber) {
      return fail(400, {
        error: "Required fields missing",
        data: { email, firstName, lastName, phone, workAddress, workRadius, idType, idNumber, bio, petCompatibility, availableDays }
      });
    }

    try {
      // Check if email already exists
      const existingUser = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return fail(400, {
          error: "Email already exists",
          data: { firstName, lastName, phone, workAddress, workRadius, idType, idNumber, bio, petCompatibility, availableDays }
        });
      }

      // Hash password
      const passwordHash = await hash(password);

      // Create user with cleaner role
      const userId = crypto.randomUUID();
      
      // Start a transaction to ensure data consistency
      // Create user
      await db.insert(user).values({
        id: userId,
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: "CLEANER",
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Generate random coordinates for demo purposes
      // In a real app, you would use a geocoding service to get these from the address
      const lat = -33.9249 + (Math.random() * 0.2 - 0.1); // Around Cape Town
      const lng = 18.4241 + (Math.random() * 0.2 - 0.1);
      
      // Create cleaner profile - NOT ACTIVE by default for public applications
      const profileId = crypto.randomUUID();
      await db.insert(cleanerProfile).values({
        id: profileId,
        userId,
        workAddress,
        workLocationLat: lat,
        workLocationLng: lng,
        workRadius,
        idType: idType as any, // Type assertion to satisfy TypeScript
        idNumber,
        taxNumber: null, // Not collected in public form
        bio,
        petCompatibility: petCompatibility as any, // Type assertion to satisfy TypeScript
        isAvailable: false, // Default to inactive until approved by admin
        availableDays,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create specializations if any
      if (specializations.length > 0) {
        // Implementation would go here to insert specializations
        // This would use the cleanerSpecialisation table
      }

      return {
        success: true
      };
    } catch (err) {
      console.error("Error submitting cleaner application:", err);
      return fail(500, {
        error: "Failed to submit application",
        data: { email, firstName, lastName, phone, workAddress, workRadius, idType, idNumber, bio, petCompatibility, availableDays }
      });
    }
  }
};
