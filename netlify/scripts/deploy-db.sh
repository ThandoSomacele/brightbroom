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
npx drizzle-kit migrate

# SAFETY CHECK: Never attempt to run seeds in production environment
if [ "$DEPLOY_CONTEXT" == "production" ] && [ "$SEED_DATABASE" == "true" ]; then
  echo -e "\e[31mERROR: Attempting to seed into a production database!\e[0m"
  echo -e "\e[31mThis operation is blocked for safety reasons.\e[0m"
  echo -e "\e[33mIf you need to seed production data, create a dedicated script with proper safeguards.\e[0m"
  exit 1
fi

