PRAGMA foreign_keys=OFF;

CREATE TABLE "Part" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "variant" TEXT,
    "weight" REAL,
    "archetype" TEXT NOT NULL,
    "tags" TEXT DEFAULT '[]',
    "notes" TEXT,
    "archived" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Arena" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "tags" TEXT DEFAULT '[]',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Combo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bladeId" TEXT NOT NULL,
    "ratchetId" TEXT NOT NULL,
    "bitId" TEXT NOT NULL,
    "archetype" TEXT NOT NULL,
    "tags" TEXT DEFAULT '[]',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "Combo_bladeId_fkey" FOREIGN KEY ("bladeId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Combo_ratchetId_fkey" FOREIGN KEY ("ratchetId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Combo_bitId_fkey" FOREIGN KEY ("bitId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Battle" (
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Battle_comboAId_fkey" FOREIGN KEY ("comboAId") REFERENCES "Combo"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Battle_comboBId_fkey" FOREIGN KEY ("comboBId") REFERENCES "Combo"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Battle_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "Arena"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Combo_bladeId_idx" ON "Combo" ("bladeId");
CREATE INDEX "Combo_ratchetId_idx" ON "Combo" ("ratchetId");
CREATE INDEX "Combo_bitId_idx" ON "Combo" ("bitId");
CREATE INDEX "Battle_comboAId_idx" ON "Battle" ("comboAId");
CREATE INDEX "Battle_comboBId_idx" ON "Battle" ("comboBId");
CREATE INDEX "Battle_arenaId_idx" ON "Battle" ("arenaId");

PRAGMA foreign_keys=ON;
