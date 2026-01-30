# Beyblade X Combo Analyzer — Etapa 1

Aplicação full-stack para catalogar peças, montar combos, registrar batalhas e iniciar análises de desempenho de Beyblade X. A Etapa 1 entrega o monorepo com API Express/Prisma + SPA Vue 3 totalmente conectados, import/export e plano para recursos offline.

## Stack

- **Frontend:** Vite + Vue 3 (JavaScript), Pinia, Vue Router, TailwindCSS custom, Axios.
- **Backend:** Node.js + Express, Prisma ORM, SQLite (migrável para Postgres), Zod para validação.
- **Infra:** Workspaces npm, rotas de backup/import JSON/CSV, conectores externos de peças (placeholder), scripts unificados para dev/build/deploy.

## Estrutura do repositório

```
.
   "name": "Cobalt Drake",
   "type": "BLADE",
   "archetype": "ATTACK",
   "subArchetype": "Linha BX",
   "variant": "BX",
   "weight": 38.0,
   "tags": ["BX"],
   "notes": "Blade de explosão constante",
   "imageUrl": "https://placehold.co/320x320?text=Cobalt+Drake",
| `npm install` | Instala dependências do monorepo e dos workspaces. |
| `npm run setup:db` | Aplica migrations (`prisma migrate deploy`) e roda o seed. O seed limpa todas as tabelas antes de recriar os dados demo, portanto é idempotente. |
| `npm run dev` | Sobe **backend (porta 4000)** e **frontend (porta 5173)** simultaneamente via `concurrently`. |
| `npm run build` | Gera `backend/dist` e `frontend/dist`. |
| `npm start` | Executa `backend/dist` e `frontend` em modo preview (requer `npm run build` prévio). |
| `npm run build:backend` / `npm run build:frontend` | Builds individuais, caso precise. |

### Passo a passo “zero ➜ rodando”

```bash
npm install
cp backend/.env.example backend/.env   # ajuste se quiser outro caminho para o SQLite
npm run setup:db                       # migrations + seed (idempotente)
npm run dev                            # abre http://localhost:5173 (frontend) + http://localhost:4000 (API)
```

Para subir em modo “produção” local:

```bash
npm run build
npm start
```

## Import/Export e dados seed

- **Backup completo JSON:** `GET /api/backup/json` (inclui parts, combos, arenas e battles).
- **Import JSON:** `POST /api/backup/json` (sobrescreve tudo).
- **CSV:** `GET /api/backup/parts.csv` e `GET /api/backup/battles.csv`.
- **Seed demográfico:** `npm run setup:db` sempre remove tudo (deleteMany em todas as tabelas) antes de recriar 6 peças, 2 arenas, 3 combos e 3 batalhas — portanto pode ser executado repetidamente sem lixo.

## API e payloads de exemplo

Além das rotas de backup e sync, os CRUDs principais estão expostos sob `/api`. Alguns exemplos completos:

> **Nome de combo automático:** o backend gera o nome no formato **Blade + Ratchet (somente números) + inicial do Bit**. Ex.: Blade `Shark Edge`, Ratchet `9-60` e Bit `Wave` viram `Shark Edge960W`. O frontend exibe uma prévia e não envia mais `name` manualmente.

### `POST /api/parts`

Request:

```json
{
   "name": "Strike Phoenix",
   "type": "BLADE",
   "archetype": "ATTACK",
   "subArchetype": "Burst Slayer",
   "variant": "X1",
   "weight": 36.5,
   "tags": ["metal", "burst"],
   "notes": "Uso exclusivo em arenas grandes",
   "imageUrl": "https://placehold.co/320x320?text=Strike+Phoenix"
}
```

Response:

```json
{
   "id": "clrx...",
   "name": "Strike Phoenix",
   "type": "BLADE",
   "archetype": "ATTACK",
   "subArchetype": "Burst Slayer",
   "variant": "X1",
   "weight": 36.5,
   "tags": ["metal", "burst"],
   "notes": "Uso exclusivo em arenas grandes",
   "imageUrl": "https://placehold.co/320x320?text=Strike+Phoenix",
   "archived": false,
   "createdAt": "2026-01-30T14:30:00.000Z",
   "updatedAt": "2026-01-30T14:30:00.000Z"
}
```

### `POST /api/combos`

Request (IDs das peças precisam existir e bater com o tipo informado):

```json
{
   "bladeId": "clrxBlade",
   "ratchetId": "clrxRatchet",
   "bitId": "clrxBit",
   "archetype": "ATTACK",
   "subArchetype": "Blitz Core",
   "tags": ["aggressive"],
   "notes": "Build titular",
   "status": "ACTIVE",
   "imageUrl": "https://placehold.co/320x320?text=Drake+Combo"
}
```

Response agrega as peças relacionadas:

```json
{
   "id": "clryCombo",
   "name": "Cobalt Drake560R",
   "subArchetype": "Blitz Core",
   "status": "ACTIVE",
   "archetype": "ATTACK",
   "tags": ["aggressive"],
   "imageUrl": "https://placehold.co/320x320?text=Drake+Combo",
   "blade": { "id": "clrxBlade", "name": "Cobalt Drake", "type": "BLADE", "tags": ["BX"] },
   "ratchet": { "id": "clrxRatchet", "name": "5-60", "type": "RATCHET", "tags": ["BX"] },
   "bit": { "id": "clrxBit", "name": "Rush", "type": "BIT", "tags": ["BX"] },
   "createdAt": "2026-01-30T14:35:00.000Z",
   "updatedAt": "2026-01-30T14:35:00.000Z"
}
```

### `POST /api/arenas`

```json
{
   "name": "Quad Stadium",
   "model": "X-01",
   "tags": ["official"],
   "notes": "Atenção ao ponto de colisão norte"
}
```

Response devolve o registro com `tags` já desserializado.

### `POST /api/battles`

```json
{
   "comboAId": "clryComboA",
   "comboBId": "clryComboB",
   "result": "COMBO_A",
   "score": "3-1",
   "victoryType": "knockout",
   "arenaId": "clrArena",
   "notes": "Forte vantagem no início",
   "occurredAt": "2026-01-25T19:00:00.000Z"
}
```

`GET /api/battles` retorna as relações completas dos combos e da arena já com arrays de tags parseados.

> **Metadados:** `GET /api/parts/metadata` e `GET /api/combos/metadata` devolvem as listas de `types`, `archetypes` e `statuses` utilizadas nos selects do frontend.

## Banco de dados & validações

### Campos principais

| Tabela | Campos |
| --- | --- |
| `Part` | `id (cuid)`, `name (TEXT)`, `type (TEXT)`, `variant (TEXT?)`, `weight (REAL?)`, `archetype (TEXT)`, `subArchetype (TEXT?)`, `tags (TEXT JSON)`, `notes (TEXT?)`, `imageUrl (TEXT?)`, `archived (BOOLEAN)`, `createdAt`, `updatedAt`. |
| `Arena` | `id`, `name`, `model?`, `tags (TEXT JSON)`, `notes?`, `createdAt`, `updatedAt`. |
| `Combo` | `id`, `name`, `bladeId`, `ratchetId`, `bitId`, `archetype (TEXT)`, `subArchetype (TEXT?)`, `tags (TEXT JSON)`, `notes?`, `imageUrl (TEXT?)`, `status (TEXT)`, `createdAt`, `updatedAt` ✅. |
| `Battle` | `id`, `comboAId`, `comboBId`, `result (TEXT)`, `score?`, `victoryType?`, `arenaId?`, `notes?`, `occurredAt`, `createdAt`, `updatedAt`. |

- Todos os campos originalmente planejados como enums ou JSON foram convertidos para `TEXT`/`TEXT JSON string` para respeitar as limitações do SQLite. No Prisma as colunas `type`, `archetype`, `status`, `result` e `tags` são `String` (TEXT) – `tags` guarda um JSON string (`[]` por padrão).
- Os módulos `parts.schema.ts`, `combos.schema.ts` e `battles.schema.ts` usam Zod com `z.enum` baseado em tuplas readonly para garantir que apenas os valores válidos cheguem na API; já `tags` são validadas como `array(z.string())` e depois serializadas/deserializadas pelos helpers `toJsonArray`/`ensureStringArray`.
- O frontend consome as mesmas listas (expostas pelas rotas `/metadata`) para manter consistência visual.

## Offline & Sync Roadmap

- **Etapa 1 (entregue):** CRUDs completos, backup/import CSV/JSON e arquitetura preparada para IndexedDB.
- **Etapa 2:** adicionar PWA (vite-plugin-pwa), cache offline, Dexie + fila de sync usando `/api/sync/apply`.
- **Etapa 3:** métricas avançadas, dashboards de winrate/sinergia e ranking contextual.
- **Etapa 4:** UX refinada, import incremental e conectores externos reais.
