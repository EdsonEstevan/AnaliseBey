-- Create the new Blader table
CREATE TABLE "Blader" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "age" INTEGER,
    "country" TEXT,
    "team" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Blader_pkey" PRIMARY KEY ("id")
);

-- Add optional blader ownership to decks
ALTER TABLE "Deck" ADD COLUMN "bladerId" TEXT;

-- Track who played each side of a battle
ALTER TABLE "Battle" ADD COLUMN "bladerAId" TEXT;
ALTER TABLE "Battle" ADD COLUMN "bladerBId" TEXT;

-- Foreign keys
ALTER TABLE "Battle"
  ADD CONSTRAINT "Battle_bladerAId_fkey" FOREIGN KEY ("bladerAId") REFERENCES "Blader"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Battle"
  ADD CONSTRAINT "Battle_bladerBId_fkey" FOREIGN KEY ("bladerBId") REFERENCES "Blader"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Deck"
  ADD CONSTRAINT "Deck_bladerId_fkey" FOREIGN KEY ("bladerId") REFERENCES "Blader"("id") ON DELETE SET NULL ON UPDATE CASCADE;
