// scripts/db/seed-earnings.ts
// Seed test earnings data for cleaner payout testing
import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import {
  createDbConnection,
  closeConnection,
  logDbInfo,
  isProduction,
} from "./utils";

// Import the schema
import * as schema from "../../src/lib/server/db/schema";

// Import payout calculator
import { calculatePayout, type PaymentMethodType } from "../../src/lib/utils/payout-calculator";

async function seedEarnings() {
  // Safety check for production environment
  const prodCheck = logDbInfo();

  if (prodCheck.isProduction) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      "Cannot seed test earnings data in production!"
    );
    process.exit(1);
  }

  console.log("\n📊 Seeding test earnings data...\n");

  // Connect to database
  const { client, db } = createDbConnection();

  try {
    // Find a cleaner user
    const cleaners = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.role, "CLEANER"))
      .limit(5);

    if (cleaners.length === 0) {
      console.error("❌ No cleaners found. Please seed users first.");
      process.exit(1);
    }

    console.log(`Found ${cleaners.length} cleaner(s)`);

    // Find a customer user
    const customers = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.role, "CUSTOMER"))
      .limit(1);

    if (customers.length === 0) {
      console.error("❌ No customers found. Please seed users first.");
      process.exit(1);
    }

    const customer = customers[0];

    // Find customer's address
    const addresses = await db
      .select()
      .from(schema.address)
      .where(eq(schema.address.userId, customer.id))
      .limit(1);

    if (addresses.length === 0) {
      console.error("❌ No address found for customer. Creating one...");
      const addressId = crypto.randomUUID();
      await db.insert(schema.address).values({
        id: addressId,
        userId: customer.id,
        street: "123 Test Street",
        city: "Cape Town",
        state: "Western Cape",
        zipCode: "8001",
        isDefault: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      addresses.push({ id: addressId } as any);
    }

    const address = addresses[0];

    // Find a service
    const services = await db.select().from(schema.service).limit(1);

    if (services.length === 0) {
      console.error("❌ No services found. Please seed services first.");
      process.exit(1);
    }

    const service = services[0];

    // Payment methods to test
    const paymentMethods: PaymentMethodType[] = ["CREDIT_CARD", "EFT", "SNAPSCAN"];

    // Create test bookings and payments for each cleaner
    for (const cleaner of cleaners) {
      console.log(`\n👤 Creating test data for cleaner: ${cleaner.firstName} ${cleaner.lastName}`);

      // Create 3 completed bookings with payments (past earnings)
      for (let i = 0; i < 3; i++) {
        const bookingId = crypto.randomUUID();
        const paymentId = crypto.randomUUID();
        const bookingPrice = 450 + (i * 100); // R450, R550, R650
        const paymentMethod = paymentMethods[i % paymentMethods.length];

        // Calculate payout breakdown
        const payout = calculatePayout(bookingPrice, paymentMethod);

        // Create completed booking
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() - (7 * (i + 1))); // 1, 2, 3 weeks ago

        await db.insert(schema.booking).values({
          id: bookingId,
          userId: customer.id,
          addressId: address.id,
          serviceId: service.id,
          cleanerId: cleaner.id,
          status: "COMPLETED",
          scheduledDate,
          duration: 3,
          price: bookingPrice.toString(),
          bedroomCount: 2 + i,
          bathroomCount: 1 + (i % 2),
          createdAt: scheduledDate,
          updatedAt: new Date(),
        });

        // Create completed payment with payout breakdown
        await db.insert(schema.payment).values({
          id: paymentId,
          bookingId,
          userId: customer.id,
          amount: bookingPrice.toString(),
          status: "COMPLETED",
          paymentMethod,
          platformCommissionRate: (payout.commissionRate * 100).toString(),
          platformCommissionAmount: payout.commissionAmount.toString(),
          payFastFeeAmount: payout.payFastFee.toString(),
          cleanerPayoutAmount: payout.cleanerPayout.toString(),
          isPaidToProvider: i === 0, // First one is paid, others pending
          providerPayoutDate: i === 0 ? new Date() : null,
          createdAt: scheduledDate,
          updatedAt: new Date(),
        });

        console.log(`  ✅ Created completed booking #${i + 1}: R${bookingPrice} (${paymentMethod})`);
        console.log(`     Payout: R${payout.cleanerPayout.toFixed(2)} (after R${payout.payFastFee.toFixed(2)} PayFast + R${payout.commissionAmount.toFixed(2)} commission)`);
      }

      // Create 2 upcoming bookings (potential earnings)
      for (let i = 0; i < 2; i++) {
        const bookingId = crypto.randomUUID();
        const bookingPrice = 500 + (i * 150); // R500, R650

        // Create confirmed booking for the future
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + (3 + i * 4)); // 3 and 7 days from now

        await db.insert(schema.booking).values({
          id: bookingId,
          userId: customer.id,
          addressId: address.id,
          serviceId: service.id,
          cleanerId: cleaner.id,
          status: "CONFIRMED",
          scheduledDate,
          duration: 3,
          price: bookingPrice.toString(),
          bedroomCount: 3,
          bathroomCount: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Calculate estimated payout for display
        const estimatedPayout = calculatePayout(bookingPrice, "CREDIT_CARD");

        console.log(`  📅 Created upcoming booking #${i + 1}: R${bookingPrice}`);
        console.log(`     Estimated payout: R${estimatedPayout.cleanerPayout.toFixed(2)}`);
      }
    }

    console.log("\n✅ Test earnings data seeded successfully!\n");
    console.log("You can now view cleaner earnings at /admin/cleaners/[id]");

  } catch (error) {
    console.error("❌ Error seeding earnings data:", error);
    await closeConnection(client);
    process.exit(1);
  }

  await closeConnection(client);
}

// Run the seeder
seedEarnings();
