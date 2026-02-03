-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER', 'VISITOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "AccessKeyStatus" AS ENUM ('AVAILABLE', 'CLAIMED', 'REVOKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "passwordNote" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "battleMilestone" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateTable
CREATE TABLE "AccessKey" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "AccessKeyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "ownerId" TEXT,
    "claimedById" TEXT,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "revokedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccessKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessKey_code_key" ON "AccessKey"("code");

-- CreateIndex
CREATE INDEX "AccessKey_ownerId_idx" ON "AccessKey"("ownerId");

-- CreateIndex
CREATE INDEX "AccessKey_claimedById_idx" ON "AccessKey"("claimedById");

-- Seed legacy user to preserve existing registros
INSERT INTO "User" ("id", "name", "username", "role", "status", "battleMilestone", "createdAt", "updatedAt", "passwordHash", "passwordNote")
VALUES ('legacy-user', 'Workspace Legacy', 'legacy', 'ADMIN', 'ACTIVE', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, 'Gerado automaticamente');

-- Add userId to Part
ALTER TABLE "Part" ADD COLUMN "userId" TEXT;
UPDATE "Part" SET "userId" = 'legacy-user' WHERE "userId" IS NULL;
ALTER TABLE "Part" ALTER COLUMN "userId" SET NOT NULL;
CREATE INDEX "Part_userId_idx" ON "Part"("userId");
ALTER TABLE "Part" ADD CONSTRAINT "Part_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add userId to Arena
ALTER TABLE "Arena" ADD COLUMN "userId" TEXT;
UPDATE "Arena" SET "userId" = 'legacy-user' WHERE "userId" IS NULL;
ALTER TABLE "Arena" ALTER COLUMN "userId" SET NOT NULL;
CREATE INDEX "Arena_userId_idx" ON "Arena"("userId");
ALTER TABLE "Arena" ADD CONSTRAINT "Arena_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add userId to Combo
ALTER TABLE "Combo" ADD COLUMN "userId" TEXT;
UPDATE "Combo" SET "userId" = 'legacy-user' WHERE "userId" IS NULL;
ALTER TABLE "Combo" ALTER COLUMN "userId" SET NOT NULL;
CREATE INDEX "Combo_userId_idx" ON "Combo"("userId");
ALTER TABLE "Combo" ADD CONSTRAINT "Combo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add userId to Blader
ALTER TABLE "Blader" ADD COLUMN "userId" TEXT;
UPDATE "Blader" SET "userId" = 'legacy-user' WHERE "userId" IS NULL;
ALTER TABLE "Blader" ALTER COLUMN "userId" SET NOT NULL;
CREATE INDEX "Blader_userId_idx" ON "Blader"("userId");
ALTER TABLE "Blader" ADD CONSTRAINT "Blader_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add userId to Deck
ALTER TABLE "Deck" ADD COLUMN "userId" TEXT;
UPDATE "Deck" SET "userId" = 'legacy-user' WHERE "userId" IS NULL;
ALTER TABLE "Deck" ALTER COLUMN "userId" SET NOT NULL;
CREATE INDEX "Deck_userId_idx" ON "Deck"("userId");
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add userId to Battle
ALTER TABLE "Battle" ADD COLUMN "userId" TEXT;
UPDATE "Battle" SET "userId" = 'legacy-user' WHERE "userId" IS NULL;
ALTER TABLE "Battle" ALTER COLUMN "userId" SET NOT NULL;
CREATE INDEX "Battle_userId_idx" ON "Battle"("userId");
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add userId to AssistantSession
ALTER TABLE "AssistantSession" ADD COLUMN "userId" TEXT;
UPDATE "AssistantSession" SET "userId" = 'legacy-user' WHERE "userId" IS NULL;
ALTER TABLE "AssistantSession" ALTER COLUMN "userId" SET NOT NULL;
CREATE INDEX "AssistantSession_userId_idx" ON "AssistantSession"("userId");
ALTER TABLE "AssistantSession" ADD CONSTRAINT "AssistantSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign keys for AccessKey relations
ALTER TABLE "AccessKey" ADD CONSTRAINT "AccessKey_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AccessKey" ADD CONSTRAINT "AccessKey_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
