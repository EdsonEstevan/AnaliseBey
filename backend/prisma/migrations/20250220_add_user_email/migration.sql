-- Add required email column to users and backfill existing records
ALTER TABLE "User" ADD COLUMN "email" TEXT;

-- Seed a placeholder email for any existing user to satisfy the NOT NULL constraint
UPDATE "User"
SET "email" = LOWER(CONCAT(username, '@placeholder.local'))
WHERE "email" IS NULL;

ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
