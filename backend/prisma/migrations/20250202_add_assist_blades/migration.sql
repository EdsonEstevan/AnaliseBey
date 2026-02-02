-- Add assist blade relation support for combos
ALTER TABLE "Combo" ADD COLUMN "assistBladeId" TEXT;

ALTER TABLE "Combo" ADD CONSTRAINT "Combo_assistBladeId_fkey"
  FOREIGN KEY ("assistBladeId") REFERENCES "Part"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
