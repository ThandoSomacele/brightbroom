#!/bin/bash
# netlify/scripts/deploy-db.sh

echo "Generating database migrations..."
npx drizzle-kit generate --schema=./src/lib/server/db/schema.ts --out=./drizzle/migrations --dialect=postgresql

echo "Applying migrations to database..."
npx tsx ./scripts/apply-migrations.ts
