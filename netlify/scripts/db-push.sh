# netlify/scripts/db-push.sh
#!/bin/bash
echo "Verifying database connection..."
if npx tsx -e "
  import { db } from './src/lib/server/db';
  try {
    console.log('Testing database connection...');
    await db.query.user.findMany({ limit: 1 });
    console.log('Database connection successful');
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
"
then
  echo "Connection successful, pushing schema..."
  npx drizzle-kit push
else
  echo "Database connection failed, skipping push"
  exit 1
fi
