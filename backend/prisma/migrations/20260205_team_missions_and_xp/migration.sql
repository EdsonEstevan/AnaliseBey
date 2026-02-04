-- Introduce team missions and XP tracking after the teams feature exists.

-- CreateEnum
CREATE TYPE "TeamMissionStatus" AS ENUM ('OPEN', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "TeamMembership"
  ADD COLUMN     "canManageMissions" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN     "lastXpAt" TIMESTAMP(3),
  ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TeamMission" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "xpReward" INTEGER NOT NULL DEFAULT 25,
    "status" "TeamMissionStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submissionNote" TEXT,
    "reviewNote" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamMission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamMission_teamId_idx" ON "TeamMission"("teamId");
CREATE INDEX "TeamMission_status_idx" ON "TeamMission"("status");

-- AddForeignKey
ALTER TABLE "TeamMission" ADD CONSTRAINT "TeamMission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMission" ADD CONSTRAINT "TeamMission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeamMission" ADD CONSTRAINT "TeamMission_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeamMission" ADD CONSTRAINT "TeamMission_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeamMission" ADD CONSTRAINT "TeamMission_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
