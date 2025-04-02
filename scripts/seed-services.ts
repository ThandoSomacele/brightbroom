// scripts/seed-services.ts
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  backupDatabase,
  closeConnection,
  confirmAction,
  db,
  isProduction,
  schema,
} from "./db-connection";
import { createDataBackup } from "./db-utils";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extract schema objects for convenience
const { service, booking, payment } = schema;

async function seedServices() {
  const args = process.argv.slice(2);
  const shouldOverwrite = args.includes("--overwrite");
  const forceProductionRun = args.includes("--confirm");
  const forceReplaceInProduction = args.includes("--force-replace");

  try {
    // SAFETY CHECK: Prevent accidental production runs
    if (isProduction && !forceProductionRun) {
      console.error(
        "\x1b[31m%s\x1b[0m",
        "⚠️ DANGER: Production database detected!",
      );
      console.error(
        "\x1b[31m%s\x1b[0m",
        "Running this script on production requires special flags.",
      );
      console.error("\x1b[33m%s\x1b[0m", "Use these flags appropriately:");
      console.error(
        "\x1b[33m%s\x1b[0m",
        "  --confirm           Required for ANY production operation",
      );
      console.error(
        "\x1b[33m%s\x1b[0m",
        "  --force-replace     Override safe mode (DANGEROUS: will delete data)",
      );
      await closeConnection();
      process.exit(1);
    }

    // Check if services already exist
    const existingServices = await db
      .select({
        id: service.id,
        name: service.name,
      })
      .from(service);

    if (existingServices.length > 0) {
      console.log(
        `Found ${existingServices.length} existing services:`,
        existingServices.map((s) => s.name).join(", "),
      );

      // SAFE MODE FOR PRODUCTION: Only add new services without deleting
      if (isProduction && !forceReplaceInProduction) {
        console.log(
          "\x1b[33m%s\x1b[0m",
          "Running in SAFE MODE: Will only add new services, not replace existing ones",
        );

        // Load service data from JSON files
        console.log("Scanning JSON files for services...");
        const servicesDir = path.join(process.cwd(), "static", "data", "json");
        const serviceFiles = fs
          .readdirSync(servicesDir)
          .filter((file) => file.endsWith(".json"));

        console.log(`Found ${serviceFiles.length} service definition files`);

        // Parse files and prepare services data
        const services = prepareServicesFromFiles(serviceFiles, servicesDir);

        // Only process services that don't already exist
        const existingServiceNames = new Set(
          existingServices.map((s) => s.name),
        );
        const newServices = services.filter(
          (s) => !existingServiceNames.has(s.name),
        );

        if (newServices.length > 0) {
          console.log(
            `Adding ${newServices.length} new services to production:`,
          );
          newServices.forEach((s) => console.log(`- ${s.name}`));

          await db.insert(service).values(newServices);
          console.log(`Successfully added ${newServices.length} new services`);
        } else {
          console.log("No new services to add to production database");
        }

        // Early exit - don't delete anything in safe mode
        await closeConnection();
        return;
      }

      // Regular overwrite mode
      if (!shouldOverwrite) {
        console.log(
          "Services already exist. Use --overwrite flag to replace them.",
        );
        await closeConnection();
        return;
      }

      // ROBUST BACKUP BEFORE DELETION
      if (isProduction) {
        // Create a full database backup for production
        await backupDatabase();
      }

      // Additional confirmation for data deletion - get all bookings instead of using count
      const allBookings = await db.select({ id: booking.id }).from(booking);
      const bookingCount = allBookings.length;

      if (bookingCount > 0) {
        console.log(
          "\x1b[31m%s\x1b[0m",
          `⚠️ WARNING: This will delete ${bookingCount} booking records!`,
        );
        const confirmed = await confirmAction(
          "Are you absolutely sure you want to proceed with deletion?",
        );

        if (!confirmed) {
          console.log("Operation cancelled by user.");
          await closeConnection();
          return;
        }
      }

      console.log(`Deleting ${existingServices.length} existing services...`);

      // Backup existing services data before deletion
      createDataBackup(existingServices, "services-backup");

      // Handle dependencies in correct order
      for (const existingService of existingServices) {
        // 1. First find all bookings for this service
        const bookingsToDelete = await db
          .select()
          .from(booking)
          .where(eq(booking.serviceId, existingService.id));

        if (bookingsToDelete.length > 0) {
          console.log(
            `Found ${bookingsToDelete.length} bookings for service ${existingService.name}`,
          );

          // Create backup of bookings before deletion
          createDataBackup(
            bookingsToDelete,
            `bookings-service-${existingService.id}`,
          );

          // 2. Delete payments related to these bookings
          for (const bookingToDelete of bookingsToDelete) {
            await db
              .delete(payment)
              .where(eq(payment.bookingId, bookingToDelete.id));
          }

          // 3. Delete the bookings
          await db
            .delete(booking)
            .where(eq(booking.serviceId, existingService.id));

          console.log(
            `Deleted bookings and related payments for service ${existingService.name}`,
          );
        }
      }

      // 4. Now it's safe to delete the services
      await db.delete(service);
    }

    // Load and insert services (only reaches here in overwrite mode or if no services exist)
    console.log("Scanning JSON files for services...");
    const servicesDir = path.join(process.cwd(), "static", "data", "json");
    const serviceFiles = fs
      .readdirSync(servicesDir)
      .filter((file) => file.endsWith(".json"));

    console.log(`Found ${serviceFiles.length} service definition files`);

    // Parse each service file
    const services = prepareServicesFromFiles(serviceFiles, servicesDir);

    // Insert services
    if (services.length > 0) {
      await db.insert(service).values(services);
      console.log(`Successfully inserted ${services.length} services`);

      // Log the services added
      services.forEach((s) => {
        console.log(`- ${s.name}: R${s.basePrice} (${s.durationHours} hours)`);
      });
    } else {
      console.log("No services found to insert");
    }
  } catch (error) {
    console.error("Error seeding services:", error);
    process.exit(1);
  } finally {
    // Always close the database connection
    await closeConnection();
  }
}

// Helper function to prepare services from JSON files
function prepareServicesFromFiles(serviceFiles: string[], servicesDir: string) {
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

    // Determine appropriate price and duration
    let basePrice = 350;
    let durationHours = 6;

    if (type === "extended") {
      basePrice = 550;
      durationHours = 10;
    } else if (category === "commercial") {
      basePrice = 450;
    } else if (serviceName.includes("Laundry")) {
      basePrice = 450;
      durationHours = 8;
    }

    services.push({
      id: crypto.randomUUID(),
      name: serviceName,
      description: getServiceDescription(serviceName),
      basePrice,
      durationHours,
      details: JSON.stringify(serviceData),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return services;
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
seedServices();
