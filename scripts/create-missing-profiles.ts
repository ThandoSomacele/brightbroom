// scripts/create-missing-profiles.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Load environment variables from .env file
dotenv.config();

// Get DATABASE_URL from environment or use a default
const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_URL_DEVELOPMENT;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set in environment or .env file');
  process.exit(1);
}

// Set up database connection
const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema });

/**
 * This script checks for cleaners without profiles and creates them
 */
async function createMissingProfiles() {
  try {
    console.log('Starting check for missing cleaner profiles...');
    
    // Get all users with CLEANER role
    const cleaners = await db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        firstName: schema.user.firstName,
        lastName: schema.user.lastName
      })
      .from(schema.user)
      .where(eq(schema.user.role, 'CLEANER'));
    
    console.log(`Found ${cleaners.length} users with CLEANER role`);
    
    // For each cleaner, check if they have a profile
    for (const cleaner of cleaners) {
      const profiles = await db
        .select({ id: schema.cleanerProfile.id })
        .from(schema.cleanerProfile)
        .where(eq(schema.cleanerProfile.userId, cleaner.id));
      
      // If no profile exists, create one
      if (profiles.length === 0) {
        console.log(`Creating missing profile for cleaner ${cleaner.firstName} ${cleaner.lastName} (${cleaner.id})`);
        
        // Create basic profile with default values
        const newProfileId = crypto.randomUUID();
        await db.insert(schema.cleanerProfile).values({
          id: newProfileId,
          userId: cleaner.id,
          idType: 'SOUTH_AFRICAN_ID',
          idNumber: '0000000000000', // Placeholder
          workLocationLat: -26.0274, // Default to Fourways
          workLocationLng: 28.0106,
          workAddress: 'Fourways, Johannesburg', // Default address
          workRadius: 10,
          petCompatibility: 'NONE',
          availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`Created profile ${newProfileId} for cleaner ${cleaner.id}`);
      } else {
        console.log(`Cleaner ${cleaner.firstName} ${cleaner.lastName} already has a profile`);
      }
    }
    
    console.log('Finished checking for missing cleaner profiles');
  } catch (error) {
    console.error('Error creating missing profiles:', error);
  } finally {
    // Close database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the function
createMissingProfiles()
  .then(() => console.log('Script completed'))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
