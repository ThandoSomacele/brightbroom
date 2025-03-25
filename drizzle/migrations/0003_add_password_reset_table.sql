-- drizzle/migrations/0003_add_password_reset_table.sql
CREATE TABLE "password_reset_token" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "token" TEXT NOT NULL UNIQUE,
  "expires_at" TIMESTAMP NOT NULL,
  "used" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster token lookups
CREATE INDEX "password_reset_token_token_idx" ON "password_reset_token"("token");
