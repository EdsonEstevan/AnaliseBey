-- CreateEnum
CREATE TYPE "WorkspacePermissionScope" AS ENUM ('PARTS_EDIT', 'USERS_MANAGE', 'ACCESS_KEYS_MANAGE', 'PUNISHMENTS_MANAGE', 'AUDIT_VIEW');

-- CreateEnum
CREATE TYPE "PartShareScope" AS ENUM ('VIEW', 'EDIT');

-- CreateEnum
CREATE TYPE "PunishmentType" AS ENUM ('TEMP_BAN', 'PARTS_LOCK', 'KEYS_LOCK', 'ACCOUNT_LIMIT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_CREATED', 'USER_UPDATED', 'USER_ROLE_CHANGED', 'USER_PUNISHED', 'USER_UNPUNISHED', 'ACCESS_KEY_CREATED', 'ACCESS_KEY_REVOKED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED', 'PART_PERMISSION_GRANTED', 'PART_PERMISSION_REVOKED', 'PASSWORD_RESET', 'DATA_TRANSFERRED');

-- CreateTable
CREATE TABLE "WorkspacePermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,
    "scope" "WorkspacePermissionScope" NOT NULL,
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspacePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartShareGrant" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "granteeId" TEXT NOT NULL,
    "scope" "PartShareScope" NOT NULL DEFAULT 'VIEW',
    "notes" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartShareGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Punishment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "type" "PunishmentType" NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Punishment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "targetUserId" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspacePermission_userId_scope_idx" ON "WorkspacePermission"("userId", "scope");

-- CreateIndex
CREATE INDEX "WorkspacePermission_grantedById_idx" ON "WorkspacePermission"("grantedById");

-- CreateIndex
CREATE UNIQUE INDEX "PartShareGrant_ownerId_granteeId_scope_key" ON "PartShareGrant"("ownerId", "granteeId", "scope");

-- CreateIndex
CREATE INDEX "PartShareGrant_granteeId_scope_idx" ON "PartShareGrant"("granteeId", "scope");

-- CreateIndex
CREATE INDEX "Punishment_userId_revokedAt_idx" ON "Punishment"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "Punishment_issuedById_idx" ON "Punishment"("issuedById");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetUserId_idx" ON "AdminAuditLog"("targetUserId");

-- AddForeignKey
ALTER TABLE "WorkspacePermission" ADD CONSTRAINT "WorkspacePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspacePermission" ADD CONSTRAINT "WorkspacePermission_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartShareGrant" ADD CONSTRAINT "PartShareGrant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartShareGrant" ADD CONSTRAINT "PartShareGrant_granteeId_fkey" FOREIGN KEY ("granteeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Punishment" ADD CONSTRAINT "Punishment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Punishment" ADD CONSTRAINT "Punishment_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
