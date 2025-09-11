import { db } from '../src/lib/server/db';
import { user, cleanerProfile } from '../src/lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

async function checkCleaners() {
  try {
    // Check for users with CLEANER role
    const cleanerUsers = await db
      .select({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive,
      })
      .from(user)
      .where(eq(user.role, 'CLEANER'));
    
    console.log(`\nFound ${cleanerUsers.length} users with CLEANER role:`);
    cleanerUsers.forEach((cleaner, index) => {
      console.log(`${index + 1}. ${cleaner.firstName} ${cleaner.lastName} (${cleaner.email}) - Active: ${cleaner.isActive}`);
    });
    
    // Check for cleaner profiles
    const profiles = await db.select().from(cleanerProfile);
    
    console.log(`\nFound ${profiles.length} cleaner profiles:`);
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. User ID: ${profile.userId}, Available: ${profile.isAvailable}, Bio: ${profile.bio?.substring(0, 50)}...`);
    });
    
    // Check for active cleaners with profiles
    const activeCleanersWithProfiles = await db
      .select({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileId: cleanerProfile.id,
        isAvailable: cleanerProfile.isAvailable,
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
    
    console.log(`\nFound ${activeCleanersWithProfiles.length} active cleaners with available profiles (these would show in the selection):`);
    activeCleanersWithProfiles.forEach((cleaner, index) => {
      console.log(`${index + 1}. ${cleaner.firstName} ${cleaner.lastName} (Profile ID: ${cleaner.profileId})`);
    });
    
  } catch (error) {
    console.error('Error checking cleaners:', error);
  } finally {
    process.exit(0);
  }
}

checkCleaners();