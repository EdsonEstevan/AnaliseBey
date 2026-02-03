# Beyblade X Combo Analyzer — Etapa 1

Aplicação full-stack para catalogar peças, montar combos, registrar batalhas e iniciar análises de desempenho de Beyblade X. A Etapa 1 entrega o monorepo com API Express/Prisma + SPA Vue 3 totalmente conectados, import/export e plano para recursos offline.

## Stack

- **Frontend:** Vite + Vue 3 (JavaScript), Pinia, Vue Router, TailwindCSS custom, Axios.
- **Backend:** Node.js + Express, Prisma ORM, SQLite (migrável para Postgres), Zod para validação.
- **Infra:** Workspaces npm, rotas de backup/import JSON/CSV, conectores externos de peças (placeholder), scripts unificados para dev/build/deploy.
- **Decks 3on3:** console para montar decks de até três combos e aplicar automaticamente nas batalhas simultâneas do compositor.
- **Bladers & Equipes:** cadastro completo dos pilotos, associação direta com decks e preenchimento automático nas batalhas para consolidar estatísticas.

### Bladers e vínculos de batalha

- Novo CRUD disponível em `/api/bladers` (listar, criar, atualizar e remover). Os registros carregam estatísticas calculadas (total, vitórias, empates, derrotas e winrate), decks vinculados e combos mais utilizados.
- Decks aceitam um `bladerId` opcional — ao selecionar um deck no compositor 3on3 o piloto é aplicado automaticamente aos slots correspondentes.
- Batalhas permitem informar `bladerAId` e `bladerBId`, e o Composer passa a oferecer selects dedicados e herda os pilotos dos decks escolhidos.
- A tela de histórico agora mostra os bladers que disputaram cada batalha e disponibiliza um filtro rápido “Filtrar por blader” para navegar apenas nos confrontos de um piloto específico.

### Relatórios enriquecidos por bey

- A página de detalhes do combo agora traz sinergias de peças calculadas automaticamente e ranking de matchups – tanto contra outros beys quanto agrupados por tipagem. Assim fica simples identificar onde cada bey performa melhor ou precisa de reforços.
- As tabelas exibem o número de batalhas consideradas, winrate e destaques visuais para vitórias/derrotas por arquétipo.

### Simulador de batalha

- Nova rota **/simulator** (menu “Simular batalha”) com um laboratório para prever o resultado entre dois beys usando apenas dados históricos.
- A simulação só é liberada se cada peça tiver ≥20 batalhas registradas e se existir pelo menos um par de peças com ≥10 batalhas juntas, garantindo previsões responsáveis.
- O painel mostra confiança, diferença estimada, cartões com scores de partes/pares e detalhamento das amostras usadas para cada bey.

### Assistente CX & séries 7-turnos

- A interface agora conta com a **Assistente CX**, um painel flutuante que acompanha qualquer tela. Ela mantém o histórico das conversas, sugere missões e orienta upgrades exigidos pelos formatos até 7 turnos.
- O Pinia store dedica persitência local da sessão (`lab-assistant-session`) e envia contexto de rota automaticamente; assim a assistente adapta as respostas conforme você abre o Dashboard, Composer ou decks.
- O painel exibe o chat completo, teclado rápido e o quadro de missões com ações para concluir, bloquear ou retomar tasks — tudo sincronizado com os novos endpoints `/assistant/*` do backend.
- Decks e Composer já conversam com a assistente via contexto, garantindo que ela monitore quando a série ainda está com menos de 7 slots e proponha metas como “Configurar série até 7 turnos”.

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

### Deploy no Vercel

> Use dois projetos separados (um para a API, outro para o SPA) a partir do mesmo repositório. Assim cada diretório (`backend/` e `frontend/`) permanece com seu próprio pipeline.

1. **Backend (API Express + Prisma)**
   - No painel do Vercel clique em *Add Project → Import Git Repository* e selecione este repo.
   - Em *Root Directory* informe `backend`.
   - *Framework Preset*: `Other`.
   - *Build Command*: `npm run build` (não será usado, mas mantém o pipeline consistente).
   - *Install Command*: `npm install` (o `postinstall` já roda `prisma generate`).
   - *Output Directory*: deixe em branco.
   - Adicione as variáveis de ambiente usadas em `backend/src/config/env.ts`: `DATABASE_URL`, `EXTERNAL_PARTS_PROVIDER` (opcional) e ajuste `PORT` para `3000` (o valor é ignorado em serverless, mas ajuda em previews).
   - Após o primeiro deploy copie a URL (ex.: `https://api-analise-bey.vercel.app`). A função serverless responde em `/api/...` porque o arquivo `backend/api/index.ts` exporta o `app` do Express.

2. **Frontend (Vite SPA)**
   - Crie outro projeto apontando para o mesmo repo e defina `frontend` como *Root Directory*.
   - *Framework Preset*: `Vite`.
   - *Build Command*: `npm run build`.
   - *Output Directory*: `dist`.
   - Configure a env `VITE_API_URL` com a URL da API criada no passo anterior (`https://api-analise-bey.vercel.app/api`).
   - Cada push na branch principal dispara build separado para o SPA.

3. **Preview branches & dev**
   - O Vercel cria prévias tanto para backend quanto para frontend. Como as URLs mudam, use os comentários automáticos do Vercel no PR para copiar o endpoint e setar `VITE_API_URL` nos *Preview Environment Variables*.
   - Lembre que Prisma precisa de um Postgres acessível ao Vercel (ex.: Supabase, Neon). Ajuste `DATABASE_URL` apontando para um host público; SQLite não funciona em serverless.

## Import/Export e dados seed

- **Backup completo JSON:** `GET /api/backup/json` (inclui parts, combos, arenas e battles).
- **Import JSON:** `POST /api/backup/json` (sobrescreve tudo).
- **CSV:** `GET /api/backup/parts.csv` e `GET /api/backup/battles.csv`.
- **Seed demográfico:** `npm run setup:db` sempre remove tudo (deleteMany em todas as tabelas) antes de recriar 6 peças, 2 arenas, 3 combos e 3 batalhas — portanto pode ser executado repetidamente sem lixo.
- **Linha Custom X expandida:** o seed agora inclui mais 16 blades CX (Antler, Arc, Blast, Brave, Brush, Dark, Eclipse, Fang, Flame, Flare, Fort, Hunt, Might, Reaper, Volt e Wriggle), todas já configuradas para aceitar Assist Blade e Lock Chip obrigatórios.
- **Lock Chips reforçados:** adicionamos 19 lock chips CX (Valkyrie, Emperor, Cerberus, Dran, Fox, Hells, Hornet, Kraken, Leon, Pegasus, Perseus, Phoenix, Rhino, Sol, Stag, Whale, Wolf e Wizard) com os pesos informados para cobrir qualquer archetype requerido pelos novos combos.
- **Assist lineup completo:** o seed também traz 13 novas Assist Blades CX (Assault, Bumper, Charge, Dual, Free, Heavy, Jaggy, Massive, Round, Slash, Turn, Wheel e Zillion), todas configuradas para coexistir com os dados já existentes.

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
