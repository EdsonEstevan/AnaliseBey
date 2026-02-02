-- Add optional lock chip relation for combos
ALTER TABLE "Combo"
  ADD COLUMN "lockChipId" TEXT;

ALTER TABLE "Combo"
  ADD CONSTRAINT "Combo_lockChipId_fkey"
  FOREIGN KEY ("lockChipId")
  REFERENCES "Part"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
