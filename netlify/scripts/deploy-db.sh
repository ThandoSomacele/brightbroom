#!/bin/bash
# netlify/scripts/deploy-db.sh

# Get the deploy context (production, development, etc.)
DEPLOY_CONTEXT=${CONTEXT:-development}
echo "Running database deployment in $DEPLOY_CONTEXT context"

# Only generate migrations in development or when explicitly requested.
#
# Deliberately not fatal: drizzle-kit generate prompts interactively when it
# cannot tell a created table from a renamed one, which no CI runner can answer.
# Generate migrations locally and commit them rather than relying on this.
if [ "$DEPLOY_CONTEXT" == "development" ] || [ "$GENERATE_MIGRATIONS" == "true" ]; then
  echo "Generating database migrations..."
  if ! pnpm exec drizzle-kit generate --schema=./src/lib/server/db/schema.ts --out=./drizzle/migrations --dialect=postgresql; then
    echo "WARNING: migration generation failed or needed input. Continuing with the committed migrations."
  fi
else
  echo "Skipping migration generation in $DEPLOY_CONTEXT environment"
fi

# Set NODE_ENV based on context for migrations
export NODE_ENV=$DEPLOY_CONTEXT

# Run migrations with the appropriate environment.
#
# This step IS fatal. It previously ran unchecked, so when the migration ledger
# fell out of sync in April 2025 every deploy failed here silently and the
# schema drifted for over a year without anyone seeing an error.
echo "Applying migrations to database..."
if ! pnpm exec drizzle-kit migrate; then
  echo -e "\e[31mERROR: Database migrations failed.\e[0m"
  echo -e "\e[33mThe deploy is being stopped so the schema and the code cannot drift apart.\e[0m"
  echo -e "\e[33mIf the ledger is out of sync with an already-migrated database,\e[0m"
  echo -e "\e[33mrun: pnpm db:migrate:rebaseline --apply\e[0m"
  exit 1
fi
echo "Migrations applied successfully"

# SAFETY CHECK: Never attempt to run seeds in production environment
if [ "$DEPLOY_CONTEXT" == "production" ] && [ "$SEED_DATABASE" == "true" ]; then
  echo -e "\e[31mERROR: Attempting to seed into a production database!\e[0m"
  echo -e "\e[31mThis operation is blocked for safety reasons.\e[0m"
  echo -e "\e[33mIf you need to seed production data, create a dedicated script with proper safeguards.\e[0m"
  exit 1
fi

