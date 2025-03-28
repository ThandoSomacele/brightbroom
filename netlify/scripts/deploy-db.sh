#!/bin/bash
# netlify/scripts/deploy-db.sh

# Get the deploy context (production, development, etc.)
DEPLOY_CONTEXT=${CONTEXT:-development}
echo "Running database deployment in $DEPLOY_CONTEXT context"

# Only generate migrations in development or when explicitly requested
if [ "$DEPLOY_CONTEXT" == "development" ] || [ "$GENERATE_MIGRATIONS" == "true" ]; then
  echo "Generating database migrations..."
  npx drizzle-kit generate --schema=./src/lib/server/db/schema.ts --out=./drizzle/migrations --dialect=postgresql
else
  echo "Skipping migration generation in $DEPLOY_CONTEXT environment"
fi

# Set NODE_ENV based on context for migrations
export NODE_ENV=$DEPLOY_CONTEXT

# Run migrations with the appropriate environment
echo "Applying migrations to database..."
npx tsx ./scripts/apply-migrations.ts
