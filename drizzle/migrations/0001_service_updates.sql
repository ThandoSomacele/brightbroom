-- Add details and isActive columns to service table
ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "details" TEXT;
ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT TRUE NOT NULL;