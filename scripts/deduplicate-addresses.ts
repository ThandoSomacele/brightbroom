// scripts/deduplicate-addresses.ts

/**
 * Address Deduplication Script
 *
 * This script identifies and removes duplicate addresses from the database.
 * It consolidates duplicate addresses by:
 * 1. Finding all duplicates per user
 * 2. Selecting the "best" address to keep
 * 3. Updating all references (bookings, subscriptions) to point to kept address
 * 4. Soft-deleting duplicate addresses
 *
 * Run with --dry-run flag to preview changes without making them.
 */

import { db } from "../src/lib/server/db/index.js";
import { address, booking, subscription } from "../src/lib/server/db/schema.js";
import { createAddressKey } from "../src/lib/utils/address-normalization.js";
import { eq, and, sql, inArray } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const skipBackupPrompt = args.includes("--skip-backup-prompt");

// Types
interface Address {
  id: string;
  userId: string;
  street: string;
  aptUnit: string | null;
  city: string;
  state: string;
  zipCode: string;
  lat: string | null;
  lng: string | null;
  instructions: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DuplicateGroup {
  normalizedKey: string;
  addresses: Address[];
  bookingCounts: Map<string, number>;
  subscriptionCounts: Map<string, number>;
}

interface DeduplicationStats {
  totalAddressesScanned: number;
  duplicateGroupsFound: number;
  addressesKept: number;
  addressesDeleted: number;
  bookingReferencesUpdated: number;
  subscriptionReferencesUpdated: number;
  errors: string[];
}

/**
 * Prompt user for confirmation
 */
async function promptConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "yes" || answer.toLowerCase() === "y");
    });
  });
}

/**
 * Find all duplicate addresses grouped by user
 */
async function findDuplicateAddresses(): Promise<Map<string, DuplicateGroup>> {
  console.log("🔍 Scanning for duplicate addresses...\n");

  // Get all active addresses
  const allAddresses = await db
    .select()
    .from(address)
    .where(eq(address.isActive, true));

  console.log(`Found ${allAddresses.length} active addresses\n`);

  // Group addresses by user and normalized key
  const addressGroups = new Map<string, Map<string, Address[]>>();

  for (const addr of allAddresses) {
    const normalizedKey = createAddressKey({
      street: addr.street,
      aptUnit: addr.aptUnit,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
    });

    if (!addressGroups.has(addr.userId)) {
      addressGroups.set(addr.userId, new Map());
    }

    const userGroups = addressGroups.get(addr.userId)!;
    if (!userGroups.has(normalizedKey)) {
      userGroups.set(normalizedKey, []);
    }

    userGroups.get(normalizedKey)!.push(addr);
  }

  // Find duplicates (groups with more than 1 address)
  const duplicates = new Map<string, DuplicateGroup>();

  for (const [userId, userGroups] of addressGroups.entries()) {
    for (const [normalizedKey, addresses] of userGroups.entries()) {
      if (addresses.length > 1) {
        const groupKey = `${userId}:${normalizedKey}`;

        // Count booking references for each address
        const bookingCounts = new Map<string, number>();
        for (const addr of addresses) {
          const [result] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(booking)
            .where(eq(booking.addressId, addr.id));
          bookingCounts.set(addr.id, result?.count || 0);
        }

        // Count subscription references for each address
        const subscriptionCounts = new Map<string, number>();
        for (const addr of addresses) {
          const [result] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(subscription)
            .where(eq(subscription.addressId, addr.id));
          subscriptionCounts.set(addr.id, result?.count || 0);
        }

        duplicates.set(groupKey, {
          normalizedKey,
          addresses,
          bookingCounts,
          subscriptionCounts,
        });
      }
    }
  }

  console.log(`📊 Found ${duplicates.size} duplicate groups\n`);

  return duplicates;
}

/**
 * Select the address to keep from a duplicate group
 *
 * Priority order:
 * 1. Default address (isDefault = true)
 * 2. Address with most booking references
 * 3. Address with most subscription references
 * 4. Address with coordinates (lat/lng not null)
 * 5. Oldest address (earliest createdAt)
 */
function selectAddressToKeep(group: DuplicateGroup): Address {
  const { addresses, bookingCounts, subscriptionCounts } = group;

  // Priority 1: Default address
  const defaultAddr = addresses.find((a) => a.isDefault);
  if (defaultAddr) {
    return defaultAddr;
  }

  // Priority 2: Most booking references
  const sortedByBookings = [...addresses].sort((a, b) => {
    const countA = bookingCounts.get(a.id) || 0;
    const countB = bookingCounts.get(b.id) || 0;
    return countB - countA;
  });

  if ((bookingCounts.get(sortedByBookings[0].id) || 0) > 0) {
    return sortedByBookings[0];
  }

  // Priority 3: Most subscription references
  const sortedBySubscriptions = [...addresses].sort((a, b) => {
    const countA = subscriptionCounts.get(a.id) || 0;
    const countB = subscriptionCounts.get(b.id) || 0;
    return countB - countA;
  });

  if ((subscriptionCounts.get(sortedBySubscriptions[0].id) || 0) > 0) {
    return sortedBySubscriptions[0];
  }

  // Priority 4: Address with coordinates
  const addrWithCoords = addresses.find(
    (a) => a.lat !== null && a.lng !== null,
  );
  if (addrWithCoords) {
    return addrWithCoords;
  }

  // Priority 5: Oldest address
  const sortedByAge = [...addresses].sort((a, b) => {
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return sortedByAge[0];
}

/**
 * Update booking references from duplicate addresses to kept address
 */
async function updateBookingReferences(
  fromIds: string[],
  toId: string,
): Promise<number> {
  let totalUpdated = 0;

  for (const fromId of fromIds) {
    const result = await db
      .update(booking)
      .set({ addressId: toId, updatedAt: new Date() })
      .where(eq(booking.addressId, fromId));

    // @ts-ignore - Drizzle returns a result with rowCount
    totalUpdated += result.rowCount || 0;
  }

  return totalUpdated;
}

/**
 * Update subscription references from duplicate addresses to kept address
 */
async function updateSubscriptionReferences(
  fromIds: string[],
  toId: string,
): Promise<number> {
  let totalUpdated = 0;

  for (const fromId of fromIds) {
    const result = await db
      .update(subscription)
      .set({ addressId: toId, updatedAt: new Date() })
      .where(eq(subscription.addressId, fromId));

    // @ts-ignore - Drizzle returns a result with rowCount
    totalUpdated += result.rowCount || 0;
  }

  return totalUpdated;
}

/**
 * Soft-delete addresses
 */
async function softDeleteAddresses(ids: string[]): Promise<void> {
  await db
    .update(address)
    .set({
      isActive: false,
      isDefault: false,
      updatedAt: new Date(),
    })
    .where(inArray(address.id, ids));
}

/**
 * Print duplicate group details
 */
function printDuplicateGroup(
  groupKey: string,
  group: DuplicateGroup,
  keepAddress: Address,
): void {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`Group: ${groupKey}`);
  console.log(`Normalized: ${group.normalizedKey}`);
  console.log(`\nAddresses in group (${group.addresses.length}):`);

  for (const addr of group.addresses) {
    const isKeeping = addr.id === keepAddress.id;
    const marker = isKeeping ? "✓ KEEP" : "✗ DELETE";
    const bookingCount = group.bookingCounts.get(addr.id) || 0;
    const subscriptionCount = group.subscriptionCounts.get(addr.id) || 0;

    console.log(`  ${marker} | ID: ${addr.id.substring(0, 8)}...`);
    console.log(
      `    Street: ${addr.street}${addr.aptUnit ? `, ${addr.aptUnit}` : ""}`,
    );
    console.log(`    City: ${addr.city}, ${addr.state} ${addr.zipCode}`);
    console.log(
      `    Default: ${addr.isDefault}, Coords: ${addr.lat ? "Yes" : "No"}`,
    );
    console.log(`    Created: ${addr.createdAt.toISOString()}`);
    console.log(
      `    Bookings: ${bookingCount}, Subscriptions: ${subscriptionCount}`,
    );
  }

  console.log(`${"=".repeat(80)}\n`);
}

/**
 * Generate detailed report
 */
async function generateReport(
  stats: DeduplicationStats,
  duplicates: Map<string, DuplicateGroup>,
): Promise<void> {
  const reportDir = path.join(process.cwd(), "reports");
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(
    reportDir,
    `address-deduplication-${timestamp}.json`,
  );

  const report = {
    timestamp: new Date().toISOString(),
    isDryRun,
    stats,
    duplicateGroups: Array.from(duplicates.entries()).map(([key, group]) => ({
      groupKey: key,
      normalizedKey: group.normalizedKey,
      addressCount: group.addresses.length,
      addresses: group.addresses.map((addr) => ({
        id: addr.id,
        street: addr.street,
        aptUnit: addr.aptUnit,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        isDefault: addr.isDefault,
        hasCoordinates: addr.lat !== null && addr.lng !== null,
        createdAt: addr.createdAt,
        bookingCount: group.bookingCounts.get(addr.id) || 0,
        subscriptionCount: group.subscriptionCounts.get(addr.id) || 0,
      })),
    })),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}\n`);
}

/**
 * Main deduplication function
 */
async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("ADDRESS DEDUPLICATION SCRIPT");
  console.log("=".repeat(80) + "\n");

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  } else {
    console.log("⚠️  LIVE MODE - Database will be modified\n");

    if (!skipBackupPrompt) {
      console.log(
        "⚠️  IMPORTANT: It is strongly recommended to create a database backup before proceeding.\n",
      );
      const shouldContinue = await promptConfirmation(
        "Have you created a database backup?",
      );
      if (!shouldContinue) {
        console.log("\n❌ Aborted. Please create a backup and try again.\n");
        process.exit(0);
      }
    }
  }

  const stats: DeduplicationStats = {
    totalAddressesScanned: 0,
    duplicateGroupsFound: 0,
    addressesKept: 0,
    addressesDeleted: 0,
    bookingReferencesUpdated: 0,
    subscriptionReferencesUpdated: 0,
    errors: [],
  };

  try {
    // Find all duplicates
    const duplicates = await findDuplicateAddresses();
    stats.duplicateGroupsFound = duplicates.size;

    if (duplicates.size === 0) {
      console.log("✅ No duplicate addresses found!\n");
      return;
    }

    // Process each duplicate group
    for (const [groupKey, group] of duplicates.entries()) {
      const keepAddress = selectAddressToKeep(group);
      const deleteAddresses = group.addresses.filter(
        (a) => a.id !== keepAddress.id,
      );

      printDuplicateGroup(groupKey, group, keepAddress);

      if (!isDryRun) {
        try {
          // Update booking references
          const bookingUpdates = await updateBookingReferences(
            deleteAddresses.map((a) => a.id),
            keepAddress.id,
          );
          stats.bookingReferencesUpdated += bookingUpdates;

          // Update subscription references
          const subscriptionUpdates = await updateSubscriptionReferences(
            deleteAddresses.map((a) => a.id),
            keepAddress.id,
          );
          stats.subscriptionReferencesUpdated += subscriptionUpdates;

          // Soft-delete duplicate addresses
          await softDeleteAddresses(deleteAddresses.map((a) => a.id));

          stats.addressesKept += 1;
          stats.addressesDeleted += deleteAddresses.length;

          console.log(`✓ Processed group ${groupKey}`);
        } catch (error) {
          const errorMsg = `Failed to process group ${groupKey}: ${error}`;
          console.error(`✗ ${errorMsg}`);
          stats.errors.push(errorMsg);
        }
      } else {
        stats.addressesKept += 1;
        stats.addressesDeleted += deleteAddresses.length;
      }
    }

    // Generate report
    await generateReport(stats, duplicates);

    // Print summary
    console.log("\n" + "=".repeat(80));
    console.log("DEDUPLICATION SUMMARY");
    console.log("=".repeat(80) + "\n");
    console.log(`Duplicate groups found: ${stats.duplicateGroupsFound}`);
    console.log(`Addresses kept: ${stats.addressesKept}`);
    console.log(`Addresses deleted: ${stats.addressesDeleted}`);
    console.log(
      `Booking references updated: ${stats.bookingReferencesUpdated}`,
    );
    console.log(
      `Subscription references updated: ${stats.subscriptionReferencesUpdated}`,
    );
    console.log(`Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log("\n❌ Errors occurred:");
      stats.errors.forEach((error) => console.log(`  - ${error}`));
    }

    console.log("\n" + "=".repeat(80) + "\n");

    if (isDryRun) {
      console.log(
        "ℹ️  This was a dry run. Run without --dry-run to apply changes.\n",
      );
    } else {
      console.log("✅ Deduplication complete!\n");
    }
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
