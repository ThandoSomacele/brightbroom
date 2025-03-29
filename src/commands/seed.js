// src/commands/seed.js
import crypto from "crypto";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { Argon2id } from "oslo/password";
import postgres from "postgres";
import fs from "fs";
import path from "path";

// Load environment variables directly
dotenv.config();

// Schema imports - note we're not using any SvelteKit imports
import {
  address,
  booking,
  cleanerProfile,
  cleanerSpecialisation,
  key,
  payment,
  service,
  user,
} from "../lib/server/db/schema.js";

// SAFETY CHECK: Prevent seeding into production databases
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Check if this is a production database
const isProductionDatabase = 
  process.env.DATABASE_URL.includes('production') || 
  process.env.DATABASE_URL === process.env.DATABASE_URL_PRODUCTION;

if (isProductionDatabase) {
  console.error("\x1b[31m%s\x1b[0m", "ERROR: Attempting to seed into a production database!");
  console.error("\x1b[31m%s\x1b[0m", "This operation is blocked for safety reasons.");
  console.error("\x1b[33m%s\x1b[0m", "If you REALLY need to seed production data, create a dedicated script with proper safeguards.");
  process.exit(1);
}

// Create db connection manually instead of using the SvelteKit-specific import
const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, {
  schema: {
    user,
    service,
    address,
    booking,
    payment,
    cleanerProfile,
    cleanerSpecialisation,
    key,
  },
});

// Function to parse CSV data
function parseServiceDetailsFromCSV(csvContent) {
  const items = [];
  
  // Split by lines
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  
  // Skip header
  let i = 1;
  
  while (i < lines.length) {
    // The area name is a line in all caps
    const area = lines[i].trim();
    i++;
    
    const details = [];
    
    // Collect all details until we hit the next area (all caps) or end of file
    while (i < lines.length && !lines[i].trim().match(/^[A-Z\s]+$/)) {
      details.push(lines[i].trim().replace(/"/g, ''));
      i++;
    }
    
    // Add this area with its details
    if (details.length > 0) {
      items.push({ area, details });
    }
  }
  
  return items;
}

// Function to load service details from CSV
function loadServiceDetails(serviceName) {
  try {
    let filename;
    
    if (serviceName.toLowerCase().includes('regular')) {
      filename = 'BrightBroom Service Description - Regular Cleaning.csv';
    } else if (serviceName.toLowerCase().includes('extended') || serviceName.toLowerCase().includes('deep')) {
      filename = 'BrightBroom Service Description - Extended Cleaning.csv';
    } else {
      // Default to regular cleaning for office cleaning
      filename = 'BrightBroom Service Description - Regular Cleaning.csv';
    }
    
    const filePath = path.join(process.cwd(), 'static', 'data', filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const items = parseServiceDetailsFromCSV(fileContent);
    
    return {
      name: serviceName,
      items
    };
  } catch (error) {
    console.error(`Error loading service details for ${serviceName}:`, error);
    return null;
  }
}

async function main() {
  try {
    // Clean up existing data
    console.log("Cleaning existing data...");
    await db.delete(payment);
    await db.delete(booking);
    await db.delete(cleanerSpecialisation);
    await db.delete(cleanerProfile);
    await db.delete(address);
    await db.delete(service);
    await db.delete(key);
    await db.delete(user);

    console.log("Creating services...");
    
    // Load service details from files
    const regularCleaningDetails = loadServiceDetails("Regular Cleaning");
    const extendedCleaningDetails = loadServiceDetails("Extended Cleaning");
    
    // Create services
    const [regularCleaning] = await db
      .insert(service)
      .values({
        id: crypto.randomUUID(),
        name: "Regular Cleaning",
        description: "Standard cleaning service for homes and apartments",
        basePrice: 350.0,
        durationHours: 6,
        details: regularCleaningDetails ? JSON.stringify(regularCleaningDetails) : null,
        isActive: true
      })
      .returning();

    const [deepCleaning] = await db
      .insert(service)
      .values({
        id: crypto.randomUUID(),
        name: "Extended Cleaning",
        description: "Thorough cleaning including hard-to-reach areas",
        basePrice: 550.0,
        durationHours: 8,
        details: extendedCleaningDetails ? JSON.stringify(extendedCleaningDetails) : null,
        isActive: true
      })
      .returning();

    const [officeCleaning] = await db
      .insert(service)
      .values({
        id: crypto.randomUUID(),
        name: "Office Cleaning",
        description: "Professional cleaning for office spaces",
        basePrice: 450.0,
        durationHours: 6,
        details: regularCleaningDetails ? JSON.stringify(regularCleaningDetails) : null, // Reuse regular cleaning details for now
        isActive: true
      })
      .returning();

    console.log("Creating admin...");
    // Hash password
    const hasher = new Argon2id();
    const adminPassword = await hasher.hash("admin123");

    // Create admin user
    const adminId = crypto.randomUUID();
    const [adminUser] = await db
      .insert(user)
      .values({
        id: adminId,
        firstName: "Admin",
        lastName: "User",
        email: "admin@brightbroom.com",
        passwordHash: adminPassword,
        role: "ADMIN",
        phone: "+27 12 345 6789",
      })
      .returning();

    // Create key for admin
    await db.insert(key).values({
      id: `email:admin@brightbroom.com`,
      userId: adminId,
      hashedPassword: adminPassword,
    });

    console.log("Creating cleaners...");
    // Hash cleaner passwords
    const cleanerPassword = await hasher.hash("cleaner123");

    // Create first cleaner with profile
    const johnId = crypto.randomUUID();
    const [johnCleaner] = await db
      .insert(user)
      .values({
        id: johnId,
        firstName: "John",
        lastName: "Cleaner",
        email: "john@brightbroom.com",
        passwordHash: cleanerPassword,
        role: "CLEANER",
        phone: "+27 11 222 3333",
      })
      .returning();

    // Create key for john
    await db.insert(key).values({
      id: `email:john@brightbroom.com`,
      userId: johnId,
      hashedPassword: cleanerPassword,
    });

    const [johnProfile] = await db
      .insert(cleanerProfile)
      .values({
        id: crypto.randomUUID(),
        userId: johnCleaner.id,
        idType: "SOUTH_AFRICAN_ID",
        idNumber: "8901015026082",
        workAddress: "123 Cleaner St, Cape Town",
        workLocationLat: -33.925,
        workLocationLng: 18.423,
        workRadius: 15.0,
        petCompatibility: "DOGS",
        availableDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
        bio: "Experienced cleaner with 5 years of professional experience.",
        rating: 4.8,
      })
      .returning();

    // Create second cleaner with profile
    const sarahId = crypto.randomUUID();
    const [sarahCleaner] = await db
      .insert(user)
      .values({
        id: sarahId,
        firstName: "Sarah",
        lastName: "Cleaner",
        email: "sarah@brightbroom.com",
        passwordHash: cleanerPassword,
        role: "CLEANER",
        phone: "+27 11 444 5555",
      })
      .returning();

    // Create key for sarah
    await db.insert(key).values({
      id: `email:sarah@brightbroom.com`,
      userId: sarahId,
      hashedPassword: cleanerPassword,
    });

    const [sarahProfile] = await db
      .insert(cleanerProfile)
      .values({
        id: crypto.randomUUID(),
        userId: sarahCleaner.id,
        idType: "PASSPORT",
        idNumber: "A12345678",
        workAddress: "456 Helper Ave, Cape Town",
        workLocationLat: -33.906,
        workLocationLng: 18.417,
        workRadius: 10.0,
        petCompatibility: "BOTH",
        availableDays: ["TUESDAY", "THURSDAY", "SATURDAY", "SUNDAY"],
        bio: "Detail-oriented and efficient. Specialized in extended cleaning.",
        rating: 4.9,
      })
      .returning();

    console.log("Creating specialisations...");
    // Add specialisations
    await db.insert(cleanerSpecialisation).values({
      id: crypto.randomUUID(),
      cleanerProfileId: johnProfile.id,
      serviceId: regularCleaning.id,
      experience: 60,
    });

    await db.insert(cleanerSpecialisation).values({
      id: crypto.randomUUID(),
      cleanerProfileId: sarahProfile.id,
      serviceId: deepCleaning.id,
      experience: 48,
    });

    await db.insert(cleanerSpecialisation).values({
      id: crypto.randomUUID(),
      cleanerProfileId: sarahProfile.id,
      serviceId: officeCleaning.id,
      experience: 36,
    });

    console.log("Creating customer...");
    // Hash customer password
    const customerPassword = await hasher.hash("customer123");

    // Create customer with addresses
    const customerId = crypto.randomUUID();
    const [customer] = await db
      .insert(user)
      .values({
        id: customerId,
        firstName: "Test",
        lastName: "Customer",
        email: "customer@example.com",
        passwordHash: customerPassword,
        role: "CUSTOMER",
        phone: "+27 12 987 6543",
      })
      .returning();

    // Create key for customer
    await db.insert(key).values({
      id: `email:customer@example.com`,
      userId: customerId,
      hashedPassword: customerPassword,
    });

    const [address1] = await db
      .insert(address)
      .values({
        id: crypto.randomUUID(),
        userId: customer.id,
        street: "123 Main Street",
        city: "Cape Town",
        state: "Western Cape",
        zipCode: "8001",
        isDefault: true,
      })
      .returning();

    const [address2] = await db
      .insert(address)
      .values({
        id: crypto.randomUUID(),
        userId: customer.id,
        street: "456 Beach Road",
        city: "Cape Town",
        state: "Western Cape",
        zipCode: "8005",
        isDefault: false,
      })
      .returning();

    console.log("Creating bookings...");
    // Create bookings
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    const [booking1] = await db
      .insert(booking)
      .values({
        id: crypto.randomUUID(),
        userId: customer.id,
        addressId: address1.id,
        serviceId: regularCleaning.id,
        cleanerId: johnCleaner.id,
        status: "CONFIRMED",
        scheduledDate: oneWeekFromNow,
        duration: regularCleaning.durationHours * 60,
        price: regularCleaning.basePrice,
        notes: "Please bring eco-friendly cleaning products",
      })
      .returning();

    await db.insert(payment).values({
      id: crypto.randomUUID(),
      bookingId: booking1.id,
      userId: customer.id,
      amount: regularCleaning.basePrice,
      status: "COMPLETED",
      paymentMethod: "CREDIT_CARD",
      payFastId: "pf_" + Math.random().toString(36).substring(2, 15),
      merchantReference: "BB-" + Math.random().toString(36).substring(2, 10),
    });

    await db.insert(booking).values({
      id: crypto.randomUUID(),
      userId: customer.id,
      addressId: address2.id,
      serviceId: deepCleaning.id,
      status: "PENDING",
      scheduledDate: twoWeeksFromNow,
      duration: deepCleaning.durationHours * 60,
      price: deepCleaning.basePrice,
      notes: "Front door code: 1234",
    });

    console.log("Database seeding completed successfully.");
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
  }
}

// Run the main function
main();
