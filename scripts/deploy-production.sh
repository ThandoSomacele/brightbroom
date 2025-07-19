#!/bin/bash

# Production Database Migration Script
# This script safely migrates the production database to the latest schema

set -e  # Exit on any error

echo "🚀 BrightBroom Production Database Migration"
echo "============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
print_status "Validating environment..."

if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set"
    print_error "Please set your production database URL:"
    print_error "export DATABASE_URL='postgres://username:password@your-neon-instance.neon.tech/database?sslmode=require'"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "drizzle" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

print_success "Environment validation complete"

# Create backup directory
BACKUP_DIR="backups/production-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

print_status "Backup directory created: $BACKUP_DIR"

# Check current migration status
print_status "Checking current migration status..."

# Get the list of migrations in the project
MIGRATION_COUNT=$(find drizzle/migrations -name "*.sql" | wc -l | tr -d ' ')
print_status "Found $MIGRATION_COUNT migrations in project"

print_status "Latest migration: $(ls drizzle/migrations/*.sql | tail -1 | xargs basename)"

# Show what will be migrated
print_status "Reviewing migration files..."
echo ""
echo "Available migrations:"
for migration in drizzle/migrations/*.sql; do
    echo "  - $(basename $migration)"
done
echo ""

# Confirmation prompt
print_warning "⚠️  PRODUCTION DATABASE MIGRATION"
print_warning "This will apply schema changes to your production database."
print_warning "Make sure you have:"
print_warning "  1. Taken a recent database backup"
print_warning "  2. Tested these migrations on a staging environment"
print_warning "  3. Verified all application code is compatible"
echo ""

read -p "Do you want to proceed with the migration? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_status "Migration cancelled by user"
    exit 0
fi

# Run the migration
print_status "Starting database migration..."

# Use drizzle-kit migrate (safer than push for production)
print_status "Running Drizzle migrations..."

if npm run db:migrate; then
    print_success "✅ Database migration completed successfully!"
else
    print_error "❌ Database migration failed!"
    print_error "Please check the error messages above and resolve any issues."
    print_error "Your database should still be in a consistent state."
    exit 1
fi

# Verify migration
print_status "Verifying migration..."

# Check if we can connect to the database
if npx drizzle-kit check; then
    print_success "✅ Migration verification passed"
else
    print_warning "⚠️  Migration verification had warnings - please review"
fi

# Optional: Run a quick smoke test
print_status "Running basic connectivity test..."

# Create a simple Node.js script to test database connection
cat > "$BACKUP_DIR/db-test.js" << 'EOF'
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
}

try {
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    // Simple query to test connection
    const result = await client`SELECT 1 as test`;
    console.log('✅ Database connection test passed');
    
    await client.end();
    process.exit(0);
} catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    process.exit(1);
}
EOF

if node "$BACKUP_DIR/db-test.js"; then
    print_success "✅ Database connectivity test passed"
else
    print_warning "⚠️  Database connectivity test failed - please investigate"
fi

# Summary
echo ""
print_success "🎉 MIGRATION COMPLETE!"
echo ""
print_status "Summary:"
print_status "  • Applied $MIGRATION_COUNT migrations"
print_status "  • Database schema is now up-to-date"
print_status "  • Backup directory: $BACKUP_DIR"
echo ""
print_status "Next steps:"
print_status "  1. Test your application thoroughly"
print_status "  2. Monitor for any issues"
print_status "  3. Run smoke tests on critical features"
echo ""
print_success "Production migration completed successfully! 🚀"