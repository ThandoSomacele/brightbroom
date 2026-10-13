#!/bin/bash
# netlify/scripts/deploy-db.sh

# Get the deploy context (production, development, etc.)
DEPLOY_CONTEXT=${CONTEXT:-development}
echo "Running database deployment in $DEPLOY_CONTEXT context"

# Migrations are never generated on the build server. The journal's history is
# hand-maintained (see CLAUDE.md), and drizzle-kit generate against it would
# produce a migration that does not match the database. Write migrations
# locally, commit them, and this script only applies them.

# Set NODE_ENV based on context for migrations
export NODE_ENV=$DEPLOY_CONTEXT

# Run migrations with the appropriate environment.
#
# This step IS fatal. It previously ran unchecked, which mattered because for
# over a year it was reading the wrong folder and applying nothing while
# reporting success. Now that it points at the real migrations, a genuine
# failure must stop the deploy rather than let the schema and code drift apart.
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

