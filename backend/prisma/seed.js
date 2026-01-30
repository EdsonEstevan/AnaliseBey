"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Limpando base...');
    await prisma.battle.deleteMany();
    await prisma.combo.deleteMany();
    await prisma.arena.deleteMany();
    await prisma.part.deleteMany();
    console.log('Criando peças...');
    const partsData = [
        {
            name: 'Strike Phoenix',
            type: client_1.PartType.BLADE,
            archetype: client_1.Archetype.ATTACK,
            tags: ['metal'],
        },
        {
            name: 'Aegis Wyvern',
            type: client_1.PartType.BLADE,
            archetype: client_1.Archetype.DEFENSE,
            tags: ['shield'],
        },
        {
            name: 'Helios Drift',
            type: client_1.PartType.BIT,
            archetype: client_1.Archetype.STAMINA,
            tags: ['bearing'],
        },
        {
            name: 'Nova Edge',
            type: client_1.PartType.BIT,
            archetype: client_1.Archetype.ATTACK,
            tags: ['aggressive'],
        },
        {
            name: 'Fortress 4-80',
            type: client_1.PartType.RATCHET,
            archetype: client_1.Archetype.DEFENSE,
            tags: ['heavy'],
        },
        {
            name: 'Glide 3-60',
            type: client_1.PartType.RATCHET,
            archetype: client_1.Archetype.BALANCE,
            tags: ['balanced'],
        },
    ];
    const parts = {};
    for (const data of partsData) {
        const part = await prisma.part.create({
            data: {
                name: data.name,
                type: data.type,
                archetype: data.archetype,
                tags: data.tags,
            },
        });
        parts[data.name] = part.id;
    }
    console.log('Criando arenas...');
    const arena = await prisma.arena.create({
        data: { name: 'Quad Stadium', model: 'X-01' },
    });
    const arena2 = await prisma.arena.create({
        data: { name: 'Speed Crater', model: 'X-02' },
    });
    console.log('Criando combos...');
    const combos = await Promise.all([
        prisma.combo.create({
            data: {
                name: 'Phoenix Blitz',
                bladeId: parts['Strike Phoenix'],
                ratchetId: parts['Glide 3-60'],
                bitId: parts['Nova Edge'],
                archetype: client_1.Archetype.ATTACK,
            },
        }),
        prisma.combo.create({
            data: {
                name: 'Wyvern Wall',
                bladeId: parts['Aegis Wyvern'],
                ratchetId: parts['Fortress 4-80'],
                bitId: parts['Helios Drift'],
                archetype: client_1.Archetype.DEFENSE,
            },
        }),
        prisma.combo.create({
            data: {
                name: 'Hybrid Pulse',
                bladeId: parts['Strike Phoenix'],
                ratchetId: parts['Fortress 4-80'],
                bitId: parts['Helios Drift'],
                archetype: client_1.Archetype.BALANCE,
            },
        }),
    ]);
    console.log('Criando batalhas de exemplo...');
    const [comboA, comboB, comboC] = combos;
    await prisma.battle.createMany({
        data: [
            {
                comboAId: comboA.id,
                comboBId: comboB.id,
                result: client_1.BattleOutcome.COMBO_A,
                victoryType: 'knockout',
                arenaId: arena.id,
            },
            {
                comboAId: comboA.id,
                comboBId: comboC.id,
                result: client_1.BattleOutcome.COMBO_B,
                victoryType: 'spin',
                arenaId: arena2.id,
            },
            {
                comboAId: comboB.id,
                comboBId: comboC.id,
                result: client_1.BattleOutcome.DRAW,
                victoryType: 'over',
                arenaId: arena.id,
            },
        ],
    });
    console.log('Seed concluído.');
}
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
