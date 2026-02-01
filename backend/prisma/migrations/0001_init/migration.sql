    -- CreateTable
    CREATE TABLE "Part" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "variant" TEXT,
        "weight" DOUBLE PRECISION,
        "archetype" TEXT NOT NULL,
        "subArchetype" TEXT,
        "tags" TEXT DEFAULT '[]',
        "notes" TEXT,
        "imageUrl" TEXT,
        "archived" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable
    CREATE TABLE "Arena" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "model" TEXT,
        "tags" TEXT DEFAULT '[]',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Arena_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable
    CREATE TABLE "Combo" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "bladeId" TEXT NOT NULL,
        "ratchetId" TEXT NOT NULL,
        "bitId" TEXT NOT NULL,
        "archetype" TEXT NOT NULL,
        "subArchetype" TEXT,
        "tags" TEXT DEFAULT '[]',
        "notes" TEXT,
        "imageUrl" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',

        CONSTRAINT "Combo_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable
    CREATE TABLE "Battle" (
        "id" TEXT NOT NULL,
        "comboAId" TEXT NOT NULL,
        "comboBId" TEXT NOT NULL,
        "result" TEXT NOT NULL,
        "score" TEXT,
        "victoryType" TEXT,
        "arenaId" TEXT,
        "notes" TEXT,
        "occurredAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
    );

    -- AddForeignKey
    ALTER TABLE "Combo" ADD CONSTRAINT "Combo_bladeId_fkey" FOREIGN KEY ("bladeId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    -- AddForeignKey
    ALTER TABLE "Combo" ADD CONSTRAINT "Combo_ratchetId_fkey" FOREIGN KEY ("ratchetId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    -- AddForeignKey
    ALTER TABLE "Combo" ADD CONSTRAINT "Combo_bitId_fkey" FOREIGN KEY ("bitId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    -- AddForeignKey
    ALTER TABLE "Battle" ADD CONSTRAINT "Battle_comboAId_fkey" FOREIGN KEY ("comboAId") REFERENCES "Combo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    -- AddForeignKey
    ALTER TABLE "Battle" ADD CONSTRAINT "Battle_comboBId_fkey" FOREIGN KEY ("comboBId") REFERENCES "Combo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    -- AddForeignKey
    ALTER TABLE "Battle" ADD CONSTRAINT "Battle_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "Arena"("id") ON DELETE SET NULL ON UPDATE CASCADE;
