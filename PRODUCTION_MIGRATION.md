# Production Database Migration Guide

## 🚨 IMPORTANT: Pre-Migration Checklist

Before running any migrations on production, ensure you have:

1. **✅ Database Backup**: Your Neon database should have automatic backups, but verify this
2. **✅ Staging Test**: Test migrations on a staging environment first
3. **✅ Downtime Planning**: Inform users of potential brief downtime
4. **✅ Rollback Plan**: Have a plan to rollback if issues occur

## Current Migration Status

- **Latest Migration**: `0005_purple_mole_man.sql` (includes guest booking fields)
- **Schema Status**: ✅ Up-to-date, no pending migrations
- **Production DB**: Neon PostgreSQL (eu-west-2 region)

## Migration Options

### Option 1: Direct Migration (Recommended)

```bash
# Set your production database URL
export DATABASE_URL="postgresql://neondb_owner:npg_wPupnhrRk5H9@ep-yellow-night-ab5ax0js-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

# Run the migration
npm run db:migrate
```

### Option 2: Using the Migration Script

```bash
# Make sure you're in the project root
cd /path/to/brightbroom

# Set production database URL
export DATABASE_URL="postgresql://neondb_owner:npg_wPupnhrRk5H9@ep-yellow-night-ab5ax0js-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

# Run the production migration script
./scripts/deploy-production.sh
```

### Option 3: Via Netlify Function (After Deployment)

```bash
# Set environment variable in Netlify dashboard:
# MIGRATION_AUTH_TOKEN=your-secure-token-here

# Make POST request to trigger migration
curl -X POST \
  -H "Authorization: Bearer your-secure-token-here" \
  https://your-site.netlify.app/.netlify/functions/db-migrate
```

## What Will Be Applied

The migrations will apply these schema changes to production:

### Migration 0005 (Latest):
- ✅ Make `user_id` nullable in bookings (for guest bookings)
- ✅ Make `address_id` nullable in bookings (for guest bookings)
- ✅ Add `guest_name` field
- ✅ Add `guest_email` field
- ✅ Add `guest_phone` field
- ✅ Add `guest_address` JSON field

### Previous Migrations (0000-0004):
- ✅ All core tables and relationships
- ✅ User authentication system
- ✅ Booking system
- ✅ Payment system
- ✅ Cleaner management
- ✅ Admin features

## Verification Steps

After migration, verify the following:

1. **Schema Check**:
   ```bash
   npx drizzle-kit check
   ```

2. **Application Test**:
   - Test user registration/login
   - Test booking creation (both authenticated and guest)
   - Test payment flow
   - Check admin functions

3. **Database Query Test**:
   ```sql
   -- Check if new guest booking fields exist
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'booking' 
   AND column_name IN ('guest_name', 'guest_email', 'guest_phone', 'guest_address');
   ```

## Environment Variables for Production

Make sure these are set in your Netlify environment:

```bash
# Required
DATABASE_URL="postgresql://neondb_owner:npg_wPupnhrRk5H9@ep-yellow-night-ab5ax0js-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
NODE_ENV="production"
PUBLIC_URL="https://brightbroom.com"

# Optional (for secure migrations)
MIGRATION_AUTH_TOKEN="your-secure-random-token"

# Your existing vars (make sure these are also set)
VITE_GOOGLE_MAPS_API_KEY="your_api_key"
RESEND_API_KEY="your_resend_key"
VITE_PAYFAST_MERCHANT_ID="your_merchant_id"
VITE_PAYFAST_MERCHANT_KEY="your_merchant_key"
VITE_PAYFAST_PASSPHRASE="your_passphrase"
VITE_APP_URL="https://brightbroom.com"
```

## Rollback Plan

If issues occur:

1. **Immediate**: Revert to previous deployment in Netlify
2. **Database**: Restore from Neon backup (if schema issues)
3. **Application**: Monitor logs and error reporting

## Post-Migration Tasks

1. **Test Critical Flows**:
   - [ ] Guest booking creation
   - [ ] User authentication 
   - [ ] Payment processing
   - [ ] Admin functions

2. **Monitor**:
   - [ ] Application logs
   - [ ] Database performance
   - [ ] User error reports

3. **Update Documentation**:
   - [ ] Update API documentation if needed
   - [ ] Update any integration guides

## Support

If you encounter issues:

1. Check the migration logs
2. Review the Drizzle documentation
3. Check Neon dashboard for database status
4. Review application logs in Netlify

---

**Ready to migrate?** Follow Option 1 for the fastest approach, or Option 2 for the guided experience.