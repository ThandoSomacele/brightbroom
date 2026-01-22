// scripts/db/seed-applications.ts
// Seed script for cleaner applications with fake South African data
import crypto from 'crypto';
import {
  createDbConnection,
  closeConnection,
  confirmAction,
  logDbInfo,
  isProduction,
  createDataBackup
} from './utils';
import * as schema from '../../src/lib/server/db/schema';
import {
  generateFirstName,
  generateSurname,
  generateSAIdNumber,
  generateSAPhoneNumber,
  generateAddress,
  generateRandomAvailability,
  generateBio,
  generateAvatarUrl,
  generateEmail,
  generateBankDetails,
  getRandomItem,
  PET_COMPATIBILITY_OPTIONS,
  REFERRAL_SOURCES
} from './sa-test-data';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  overwrite: args.includes('--overwrite') || args.includes('-o'),
  confirm: args.includes('--confirm') || args.includes('-y'),
  forceProduction: args.includes('--force-production'),
  help: args.includes('--help') || args.includes('-h'),
  count: parseInt(args.find(a => a.startsWith('--count='))?.split('=')[1] || '15', 10)
};

// Show help text
if (options.help) {
  console.log(`
BrightBroom Cleaner Applications Seeder
=======================================

Usage: npm run db:seed:applications [options]

Options:
  --overwrite, -o       Delete existing applications before seeding
  --confirm, -y         Skip confirmation prompts
  --count=N             Number of applications to create (default: 15)
  --force-production    Allow running in production (DANGEROUS)
  --help, -h            Show this help text

Examples:
  npm run db:seed:applications                 # Seed 15 applications
  npm run db:seed:applications --count=20      # Seed 20 applications
  npm run db:seed:applications -o -y           # Overwrite without confirmation
  `);
  process.exit(0);
}

// Application status distribution
interface ApplicationDistribution {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  count: number;
}

function getStatusDistribution(totalCount: number): ApplicationDistribution[] {
  // Default distribution: ~67% PENDING, ~20% APPROVED, ~13% REJECTED
  const pending = Math.floor(totalCount * 0.67);
  const approved = Math.floor(totalCount * 0.20);
  const rejected = totalCount - pending - approved;

  return [
    { status: 'PENDING', count: pending },
    { status: 'APPROVED', count: approved },
    { status: 'REJECTED', count: rejected }
  ];
}

async function seedApplications() {
  // Safety check for production environment
  const { isProduction: isProd } = logDbInfo();

  if (isProd && !options.forceProduction) {
    console.error('\x1b[31m%s\x1b[0m', 'DANGER: Production database detected!');
    console.error('\x1b[31m%s\x1b[0m', 'Running this seeder on production is blocked for safety.');
    console.error('\x1b[33m%s\x1b[0m', 'If you REALLY need to seed production data, use --force-production flag.');
    process.exit(1);
  }

  if (isProd && options.forceProduction && !options.confirm) {
    const proceed = await confirmAction(
      'You are about to SEED APPLICATIONS in a PRODUCTION database. Are you ABSOLUTELY sure?'
    );
    if (!proceed) {
      console.log('Operation cancelled');
      process.exit(0);
    }
  }

  // Create database connection
  const { client, db } = createDbConnection();

  try {
    console.log('\nStarting cleaner applications seeding process...');
    console.log(`Target: ${options.count} applications\n`);

    // Check existing applications
    const existingApplications = await db
      .select({ id: schema.cleanerApplication.id, email: schema.cleanerApplication.email })
      .from(schema.cleanerApplication);

    if (existingApplications.length > 0) {
      console.log(`Found ${existingApplications.length} existing applications`);

      if (!options.overwrite) {
        console.log('Use --overwrite to replace existing applications.');
        console.log('Proceeding to add new applications alongside existing ones...\n');
      } else {
        console.log('Deleting existing applications...');
        createDataBackup(existingApplications, 'applications-backup');
        await db.delete(schema.cleanerApplication);
        console.log('Existing applications deleted.\n');
      }
    }

    // Get status distribution
    const distribution = getStatusDistribution(options.count);
    console.log('Application distribution:');
    distribution.forEach(d => console.log(`  - ${d.status}: ${d.count}`));
    console.log();

    // Generate applications
    const applications = [];
    let applicationIndex = 0;

    for (const { status, count } of distribution) {
      for (let i = 0; i < count; i++) {
        const { name: firstName, isFemale } = generateFirstName();
        const lastName = generateSurname();
        const address = generateAddress();
        const availability = generateRandomAvailability();
        const email = generateEmail(firstName, lastName, applicationIndex);
        const idNumber = generateSAIdNumber(isFemale);

        // Create a unique seed for the avatar based on name and index
        const avatarSeed = `${firstName}-${lastName}-${applicationIndex}`;

        // Generate bank details
        const bankDetails = generateBankDetails(firstName, lastName);

        // Documents pending logic:
        // - APPROVED applications have documents complete (false)
        // - REJECTED applications might have incomplete docs (70% chance)
        // - PENDING applications mostly have documents pending (60% chance)
        let documentsPending = true;
        if (status === 'APPROVED') {
          documentsPending = false;
        } else if (status === 'REJECTED') {
          documentsPending = Math.random() > 0.3; // 70% have pending docs
        } else {
          documentsPending = Math.random() > 0.4; // 60% have pending docs
        }

        const application = {
          id: crypto.randomUUID(),
          firstName,
          lastName,
          email,
          phone: generateSAPhoneNumber(),
          city: address.city,
          latitude: String(address.latitude),
          longitude: String(address.longitude),
          formattedAddress: address.address,
          workRadius: String(15 + Math.floor(Math.random() * 15)), // 15-30km
          bio: generateBio(),
          petCompatibility: getRandomItem(PET_COMPATIBILITY_OPTIONS),
          documentsPending,
          availability: JSON.stringify(availability),
          ownTransport: Math.random() > 0.4, // 60% have own transport
          whatsApp: Math.random() > 0.2, // 80% have WhatsApp
          idType: 'SOUTH_AFRICAN_ID',
          idNumber,
          referralSource: getRandomItem(REFERRAL_SOURCES),
          profileImageUrl: generateAvatarUrl(avatarSeed),
          // Structured bank details
          bankName: bankDetails.bankName,
          bankAccountNumber: bankDetails.bankAccountNumber,
          bankBranchCode: bankDetails.bankBranchCode,
          bankAccountType: bankDetails.bankAccountType,
          bankAccountHolder: bankDetails.bankAccountHolder,
          status,
          notes: status === 'REJECTED' ? getRandomRejectionNote() : null,
          isActive: status === 'APPROVED',
          createdAt: generateRandomDate(),
          updatedAt: new Date()
        };

        applications.push(application);
        applicationIndex++;
      }
    }

    // Insert applications
    console.log('Inserting applications...');
    await db.insert(schema.cleanerApplication).values(applications);

    console.log(`\n Successfully seeded ${applications.length} cleaner applications:`);
    console.log(`   - PENDING: ${distribution.find(d => d.status === 'PENDING')?.count || 0}`);
    console.log(`   - APPROVED: ${distribution.find(d => d.status === 'APPROVED')?.count || 0}`);
    console.log(`   - REJECTED: ${distribution.find(d => d.status === 'REJECTED')?.count || 0}`);

    // Display a few sample applications
    console.log('\nSample applications created:');
    applications.slice(0, 3).forEach((app, idx) => {
      console.log(`  ${idx + 1}. ${app.firstName} ${app.lastName} (${app.status})`);
      console.log(`     Email: ${app.email}`);
      console.log(`     City: ${app.city}`);
      console.log(`     Documents Pending: ${app.documentsPending ? 'Yes' : 'No'}`);
      console.log(`     Bank: ${app.bankName || 'Not provided'} ${app.bankAccountNumber ? `(****${app.bankAccountNumber.slice(-4)})` : ''}`);
      console.log(`     Avatar: ${app.profileImageUrl}`);
    });

    console.log('\nDone! View applications at /admin/applications');
  } catch (error) {
    console.error('Error seeding applications:', error);
    process.exit(1);
  } finally {
    await closeConnection(client);
  }
}

/**
 * Generate a random date within the last 30 days
 */
function generateRandomDate(): Date {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
}

/**
 * Get a random rejection note for rejected applications
 */
function getRandomRejectionNote(): string {
  const notes = [
    'Application incomplete - missing required documentation',
    'Could not verify ID number',
    'Location outside service area',
    'Did not respond to follow-up communications',
    'Applicant withdrew application',
    'References could not be verified'
  ];
  return getRandomItem(notes);
}

// Run the seeding function
seedApplications().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
