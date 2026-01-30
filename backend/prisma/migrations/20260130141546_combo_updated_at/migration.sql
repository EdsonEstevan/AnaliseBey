/*
  Warnings:

  - You are about to alter the column `archived` on the `Part` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - Added the required column `updatedAt` to the `Combo` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Arena" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "tags" TEXT DEFAULT '[]',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Arena" ("createdAt", "id", "model", "name", "notes", "tags", "updatedAt") SELECT "createdAt", "id", "model", "name", "notes", "tags", "updatedAt" FROM "Arena";
DROP TABLE "Arena";
ALTER TABLE "new_Arena" RENAME TO "Arena";
CREATE TABLE "new_Battle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comboAId" TEXT NOT NULL,
    "comboBId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "score" TEXT,
    "victoryType" TEXT,
    "arenaId" TEXT,
    "notes" TEXT,
    "occurredAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Battle_comboAId_fkey" FOREIGN KEY ("comboAId") REFERENCES "Combo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Battle_comboBId_fkey" FOREIGN KEY ("comboBId") REFERENCES "Combo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Battle_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "Arena" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Battle" ("arenaId", "comboAId", "comboBId", "createdAt", "id", "notes", "occurredAt", "result", "score", "updatedAt", "victoryType") SELECT "arenaId", "comboAId", "comboBId", "createdAt", "id", "notes", "occurredAt", "result", "score", "updatedAt", "victoryType" FROM "Battle";
DROP TABLE "Battle";
ALTER TABLE "new_Battle" RENAME TO "Battle";
CREATE TABLE "new_Combo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bladeId" TEXT NOT NULL,
    "ratchetId" TEXT NOT NULL,
    "bitId" TEXT NOT NULL,
    "archetype" TEXT NOT NULL,
    "tags" TEXT DEFAULT '[]',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "Combo_bladeId_fkey" FOREIGN KEY ("bladeId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Combo_ratchetId_fkey" FOREIGN KEY ("ratchetId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Combo_bitId_fkey" FOREIGN KEY ("bitId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Combo" ("archetype", "bitId", "bladeId", "createdAt", "id", "name", "notes", "ratchetId", "status", "tags") SELECT "archetype", "bitId", "bladeId", "createdAt", "id", "name", "notes", "ratchetId", "status", "tags" FROM "Combo";
DROP TABLE "Combo";
ALTER TABLE "new_Combo" RENAME TO "Combo";
CREATE TABLE "new_Part" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "variant" TEXT,
    "weight" REAL,
    "archetype" TEXT NOT NULL,
    "tags" TEXT DEFAULT '[]',
    "notes" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Part" ("archetype", "archived", "createdAt", "id", "name", "notes", "tags", "type", "updatedAt", "variant", "weight") SELECT "archetype", "archived", "createdAt", "id", "name", "notes", "tags", "type", "updatedAt", "variant", "weight" FROM "Part";
DROP TABLE "Part";
ALTER TABLE "new_Part" RENAME TO "Part";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
