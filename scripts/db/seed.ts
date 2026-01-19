// scripts/db/seed.ts
import crypto from "crypto";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Argon2id } from "oslo/password";
import { 
  createDbConnection, 
  closeConnection, 
  confirmAction, 
  logDbInfo, 
  isProduction,
  createDatabaseBackup,
  createDataBackup,
  ensureDirectoryExists
} from "./utils";

// Import the schema directly - this is the key fix
import * as schema from "../../src/lib/server/db/schema";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const entityTypes = args.filter(arg => !arg.startsWith("--"));
const options = {
  overwrite: args.includes("--overwrite") || args.includes("-o"),
  confirm: args.includes("--confirm") || args.includes("-y"),
  forceProduction: args.includes("--force-production"),
  help: args.includes("--help") || args.includes("-h"),
  verbose: args.includes("--verbose") || args.includes("-v"),
  onlyServices: entityTypes.includes("services") && entityTypes.length === 1,
  onlyUsers: entityTypes.includes("users") && entityTypes.length === 1,
  debug: args.includes("--debug")
};

// Show help text
if (options.help || args.length === 0) {
  console.log(`
BrightBroom Database Seeder
===========================

Usage: npm run db:seed [entities] [options]

Entities:
  all            Seed all entities (default)
  services       Only seed services
  users          Only seed users and related entities
  cleaners       Only seed cleaner profiles

Options:
  --overwrite, -o       Overwrite existing data
  --confirm, -y         Skip confirmation prompts
  --verbose, -v         Show detailed logs
  --debug               Show debug information
  --force-production    Allow running in production (DANGEROUS)
  --help, -h            Show this help text

Examples:
  npm run db:seed                 # Seed all entities (with confirmation)
  npm run db:seed services -o     # Overwrite just services
  npm run db:seed users --confirm # Seed users without confirmation
  `);
  process.exit(0);
}

async function seedDatabase() {
  // Safety check for production environment
  const { isProduction } = logDbInfo();

  if (isProduction && !options.forceProduction) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      "⚠️ DANGER: Production database detected!"
    );
    console.error(
      "\x1b[31m%s\x1b[0m",
      "Running this seeder on production is blocked for safety."
    );
    console.error(
      "\x1b[33m%s\x1b[0m",
      "If you REALLY need to seed production data, use --force-production flag."
    );
    process.exit(1);
  }

  if (isProduction && options.forceProduction && !options.confirm) {
    const proceed = await confirmAction(
      "⚠️ You are about to SEED DATA in a PRODUCTION database. This is potentially DESTRUCTIVE. Are you ABSOLUTELY sure?"
    );
    
    if (!proceed) {
      console.log("Operation cancelled");
      process.exit(0);
    }

    // Create backup before proceeding
    await createDatabaseBackup();
  }

  // Create database connection
  const { client, db } = createDbConnection();
  
  // Get references to schema tables directly from the imported schema, not from db.schema
  const { 
    service, 
    user, 
    cleanerProfile, 
    cleanerSpecialisation, 
    address, 
    booking, 
    payment, 
    key 
  } = schema;

  try {
    // Start seeding process
    console.log("Starting database seeding process...");

    // Seed services
    if (!options.onlyUsers) {
      // Check existing services before seeding
      const existingServices = await db
        .select({
          id: service.id,
          name: service.name,
        })
        .from(service);

      if (existingServices.length > 0 && !options.overwrite) {
        console.log(
          `Found ${existingServices.length} existing services. Use --overwrite to replace.`
        );
      } else {
        if (existingServices.length > 0) {
          console.log(`Deleting ${existingServices.length} existing services...`);
          // Backup existing services before deletion
          createDataBackup(existingServices, "services-backup");

          // Handle dependent entities
          const bookingsToDelete = await db.select().from(booking);
          
          if (bookingsToDelete.length > 0) {
            console.log(`Found ${bookingsToDelete.length} bookings that will be deleted`);
            createDataBackup(bookingsToDelete, "bookings-backup");
            
            // Delete payments first
            await db.delete(payment);
            console.log("Deleted associated payments");
            
            // Delete bookings
            await db.delete(booking);
            console.log("Deleted associated bookings");
          }
          
          // Delete specialisations
          await db.delete(cleanerSpecialisation);
          
          // Now safe to delete services
          await db.delete(service);
        }

        // Seed services
        console.log("Seeding services...");
        await seedServices(db);
      }
    }

    // Seed users and related entities if needed
    if (!options.onlyServices) {
      // Check existing users before seeding
      const existingUsers = await db
        .select({
          id: user.id,
          email: user.email,
          role: user.role,
        })
        .from(user);

      if (existingUsers.length > 0 && !options.overwrite) {
        console.log(
          `Found ${existingUsers.length} existing users. Use --overwrite to replace.`
        );
      } else {
        if (existingUsers.length > 0) {
          console.log(`Deleting ${existingUsers.length} existing users and related data...`);
          // Backup before deletion
          createDataBackup(existingUsers, "users-backup");
          
          // Delete in order of dependencies
          await db.delete(payment);
          await db.delete(booking);
          await db.delete(cleanerSpecialisation);
          await db.delete(cleanerProfile);
          await db.delete(address);
          await db.delete(key);
          await db.delete(user);
        }

        // Seed users
        console.log("Seeding users...");
        await seedUsers(db);
      }
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  } finally {
    // Close the database connection
    await closeConnection(client);
  }
}

// Seed services from JSON files
async function seedServices(db: any) {
  try {
    console.log("Scanning JSON files for services...");
    const servicesDir = path.join(process.cwd(), "static", "data", "json");
    
    // Create directory if it doesn't exist
    ensureDirectoryExists(servicesDir);
    
    // Find JSON files
    const serviceFiles = fs.readdirSync(servicesDir)
      .filter((file) => file.endsWith(".json"));

    console.log(`Found ${serviceFiles.length} service definition files`);

    // Parse each service file
    const services = [];
    for (const file of serviceFiles) {
      const filePath = path.join(servicesDir, file);
      const serviceData = JSON.parse(fs.readFileSync(filePath, "utf8"));

      // Create service object
      const serviceName = serviceData.name;

      // Transform service name to get proper type and category
      const type = serviceName.toLowerCase().includes("extended")
        ? "extended"
        : "regular";
      const category = serviceName.toLowerCase().includes("office")
        ? "commercial"
        : "residential";

      // Determine sort order - keep Regular Cleaning first
      let sortOrder = 999;
      if (serviceName.includes("Regular Cleaning") && !serviceName.includes("Laundry")) {
        sortOrder = 1;
      } else if (serviceName.includes("Regular Cleaning") && serviceName.includes("Laundry")) {
        sortOrder = 2;
      } else if (serviceName.includes("Extended")) {
        sortOrder = 3;
      } else if (serviceName.includes("Office")) {
        sortOrder = 4;
      }

      // Determine appropriate price and duration
      let basePrice = 350;
      let durationHours = 6;

      if (type === "extended") {
        basePrice = 500;
        durationHours = 10;
      } else if (category === "commercial") {
        basePrice = 450;
      } else if (serviceName.includes("Laundry")) {
        basePrice = 400;
        durationHours = 8;
      }

      services.push({
        id: crypto.randomUUID(),
        name: serviceName,
        description: getServiceDescription(serviceName),
        basePrice,
        durationHours,
        sortOrder,
        details: JSON.stringify(serviceData),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Insert services
    if (services.length > 0) {
      await db.insert(schema.service).values(services);
      console.log(`Successfully inserted ${services.length} services`);

      // Log the services added
      services.forEach((s) => {
        console.log(`- ${s.name}: R${s.basePrice} (${s.durationHours} hours)`);
      });
    } else {
      console.log("No services found to insert");
    }

    return services;
  } catch (error) {
    console.error("Error seeding services:", error);
    throw error;
  }
}

// Seed users (admin, customers, cleaners)
async function seedUsers(db: any) {
  try {
    const hasher = new Argon2id();
    
    // Create admin user
    console.log("Creating admin user...");
    const adminPassword = await hasher.hash("admin123");
    const adminId = crypto.randomUUID();
    
    const [adminUser] = await db.insert(schema.user)
      .values({
        id: adminId,
        firstName: "Admin",
        lastName: "User",
        email: "admin@brightbroom.com",
        passwordHash: adminPassword,
        role: "ADMIN",
        phone: "+27 12 345 6789",
        isActive: true,
      })
      .returning();

    // Create key for admin
    await db.insert(schema.key).values({
      id: `email:admin@brightbroom.com`,
      userId: adminId,
      hashedPassword: adminPassword,
    });

    // Create customer
    console.log("Creating customer user...");
    const customerPassword = await hasher.hash("customer123");
    const customerId = crypto.randomUUID();
    
    const [customer] = await db.insert(schema.user)
      .values({
        id: customerId,
        firstName: "Test",
        lastName: "Customer",
        email: "customer@example.com",
        passwordHash: customerPassword,
        role: "CUSTOMER",
        phone: "+27 12 987 6543",
        isActive: true,
      })
      .returning();

    // Create key for customer
    await db.insert(schema.key).values({
      id: `email:customer@example.com`,
      userId: customerId,
      hashedPassword: customerPassword,
    });

    // Create addresses for customer
    const [address1] = await db.insert(schema.address)
      .values({
        id: crypto.randomUUID(),
        userId: customer.id,
        street: "123 Main Street",
        city: "Cape Town",
        state: "Western Cape",
        zipCode: "8001",
        isDefault: true,
        isActive: true,
      })
      .returning();

    await db.insert(schema.address)
      .values({
        id: crypto.randomUUID(),
        userId: customer.id,
        street: "456 Beach Road",
        city: "Cape Town",
        state: "Western Cape",
        zipCode: "8005",
        isDefault: false,
        isActive: true,
      });

    // Create cleaners
    console.log("Creating cleaner users...");
    const cleanerPassword = await hasher.hash("cleaner123");

    // First cleaner
    const johnId = crypto.randomUUID();
    const [johnCleaner] = await db.insert(schema.user)
      .values({
        id: johnId,
        firstName: "John",
        lastName: "Cleaner",
        email: "john@brightbroom.com",
        passwordHash: cleanerPassword,
        role: "CLEANER",
        phone: "+27 11 222 3333",
        isActive: true,
      })
      .returning();

    // Create key for john
    await db.insert(schema.key).values({
      id: `email:john@brightbroom.com`,
      userId: johnId,
      hashedPassword: cleanerPassword,
    });

    // Create cleaner profile
    const [johnProfile] = await db.insert(schema.cleanerProfile)
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
        isAvailable: true,
      })
      .returning();

    // Second cleaner
    const sarahId = crypto.randomUUID();
    const [sarahCleaner] = await db.insert(schema.user)
      .values({
        id: sarahId,
        firstName: "Sarah",
        lastName: "Cleaner",
        email: "sarah@brightbroom.com",
        passwordHash: cleanerPassword,
        role: "CLEANER",
        phone: "+27 11 444 5555",
        isActive: true,
      })
      .returning();

    // Create key for sarah
    await db.insert(schema.key).values({
      id: `email:sarah@brightbroom.com`,
      userId: sarahId,
      hashedPassword: cleanerPassword,
    });

    // Create profile for Sarah
    const [sarahProfile] = await db.insert(schema.cleanerProfile)
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
        bio: "Detail-oriented and efficient. specialised in extended cleaning.",
        rating: 4.9,
        isAvailable: true,
      })
      .returning();

    // Add specialisations
    console.log("Creating specialisations...");
    
    // Get services
    const services = await db.select().from(schema.service);
    
    // Find services by name
    const regularCleaning = services.find(s => s.name === "Regular Cleaning");
    const extendedCleaning = services.find(s => s.name === "Extended Cleaning");
    const officeCleaning = services.find(s => s.name === "Office Cleaning");
    
    if (regularCleaning) {
      await db.insert(schema.cleanerSpecialisation).values({
        id: crypto.randomUUID(),
        cleanerProfileId: johnProfile.id,
        serviceId: regularCleaning.id,
        experience: 60,
      });
    }

    if (extendedCleaning) {
      await db.insert(schema.cleanerSpecialisation).values({
        id: crypto.randomUUID(),
        cleanerProfileId: sarahProfile.id,
        serviceId: extendedCleaning.id,
        experience: 48,
      });
    }

    if (officeCleaning) {
      await db.insert(schema.cleanerSpecialisation).values({
        id: crypto.randomUUID(),
        cleanerProfileId: sarahProfile.id,
        serviceId: officeCleaning.id,
        experience: 36,
      });
    }

    // Create some bookings
    console.log("Creating sample bookings...");
    
    if (regularCleaning) {
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      
      const [booking1] = await db.insert(schema.booking)
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
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Add payment
      await db.insert(schema.payment).values({
        id: crypto.randomUUID(),
        bookingId: booking1.id,
        userId: customer.id,
        amount: regularCleaning.basePrice,
        status: "COMPLETED",
        paymentMethod: "CREDIT_CARD",
        payFastId: "pf_" + Math.random().toString(36).substring(2, 15),
        merchantReference: "BB-" + Math.random().toString(36).substring(2, 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    if (extendedCleaning) {
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
      
      await db.insert(schema.booking)
        .values({
          id: crypto.randomUUID(),
          userId: customer.id,
          addressId: address1.id,
          serviceId: extendedCleaning.id,
          status: "PENDING",
          scheduledDate: twoWeeksFromNow,
          duration: extendedCleaning.durationHours * 60,
          price: extendedCleaning.basePrice,
          notes: "Front door code: 1234",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
    }

    console.log("Users and related entities seeded successfully");
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
}

// Helper to generate service descriptions
function getServiceDescription(name: string): string {
  if (name.includes("Regular Cleaning with Laundry")) {
    return "Standard cleaning service with laundry and ironing assistance.";
  } else if (name.includes("Extended Cleaning")) {
    return "A thorough cleaning service that reaches every corner and detail.";
  } else if (name.includes("Office Cleaning")) {
    return "Professional cleaning for your office space or commercial property.";
  } else {
    return "Perfect for maintaining a clean and tidy home on a regular basis.";
  }
}

// Run the seeding function
seedDatabase().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
