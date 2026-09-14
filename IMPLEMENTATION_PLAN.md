# Numchess Ultimate — Elite Implementation Plan

**Document purpose:** Turn the prototype (`index.html`) and design spec (`NUMCHESS_DESIGN_DOCUMENT.md`) into a production-quality web game with a correct rules engine, polished UX, tests, replay, and a path to online play and AI.

**Status:** **In progress** — **Phase 3b (elite light UI) shipped**; optional polish (Storybook, design mocks) remains  
**Target product:** Numchess Classic (pure rules) + Numchess Ultimate (Classic + analysis UI + optional advanced rules)  
**Last updated:** 2026-09-14

---

## Document revision history

| Version | Focus |
|---------|--------|
| **v2** | Pre-flight governance, monorepo pitfalls, fast-check, balance sim, PartyKit, PWA, a11y grid, replay package, ADRs |
| **v3** | Turbo/`tasks` pipeline, engine dev workflow (Vite→src vs tsup), Biome option, MVP scope fix, security/CSP, exports map, phase checklists, ADR-004 build |
| **v4** | shadcn/Tailwind v4 Phase 3 recipe, Playwright PWA offline sequence, rulesVersion vs semver policy, `@numchess/replay` Zod contract, engine CHANGELOG |
| **v5** | **Progress snapshot**, Phase **3a / 3b** split, **light-only** visual direction, Phase 7 **deferred**, link [Elite UI plan](docs/UI_ELITE_IMPLEMENTATION_PLAN.md) |

**Related docs:** `NUMCHESS_DESIGN_DOCUMENT.md` (game design), `adr/*.md` (decisions), `docs/RULES.md`, [docs/UI_ELITE_IMPLEMENTATION_PLAN.md](docs/UI_ELITE_IMPLEMENTATION_PLAN.md) (Phase 3b), [docs/LIVE_SCORING_AND_AUDIO_PLAN.md](docs/LIVE_SCORING_AND_AUDIO_PLAN.md).

---

## Table of contents

0. [Pre-flight sign-off](#0-pre-flight-sign-off)
1. [Vision and success criteria](#1-vision-and-success-criteria)
2. [Canonical rules (lock before coding)](#2-canonical-rules-lock-before-coding)
3. [Architecture](#3-architecture)
4. [Technology stack](#4-technology-stack)
5. [Repository layout](#5-repository-layout)
6. [Phase 0 — Project bootstrap](#6-phase-0--project-bootstrap)
7. [Phase 1 — Rules spec and engine core](#7-phase-1--rules-spec-and-engine-core)
8. [Phase 2 — Scoring, winner, balance, and invariants](#8-phase-2--scoring-winner-balance-and-invariants)
9. [Phase 3 — Elite UI shell](#9-phase-3--elite-ui-shell)
10. [Phase 4 — Gameplay UX (threats, inventory, endgame)](#10-phase-4--gameplay-ux-threats-inventory-endgame)
11. [Phase 5 — Modes, undo, replay, persistence](#11-phase-5--modes-undo-replay-persistence)
12. [Phase 6 — AI and analysis](#12-phase-6--ai-and-analysis)
13. [Phase 7 — Online multiplayer (optional milestone)](#13-phase-7--online-multiplayer-optional-milestone)
14. [Phase 8 — Numchess Arena (competitive)](#14-phase-8--numchess-arena-competitive)
15. [Testing strategy](#15-testing-strategy)
16. [Design system and visual direction](#16-design-system-and-visual-direction)
17. [Audio, accessibility, and performance](#17-audio-accessibility-and-performance)
18. [DevOps, deployment, and quality gates](#18-devops-deployment-and-quality-gates)
19. [Migration from prototype](#19-migration-from-prototype)
20. [Timeline and staffing](#20-timeline-and-staffing)
21. [Risks and mitigations](#21-risks-and-mitigations)
22. [Appendix — dependency reference](#22-appendix--dependency-reference)
23. [Architecture decision records (ADRs)](#23-architecture-decision-records-adrs)
24. [Open decisions (resolve before or during Phase 2)](#24-open-decisions-resolve-before-or-during-phase-2)
25. [Phase execution checklists](#25-phase-execution-checklists)
26. [Security and privacy (web)](#26-security-and-privacy-web)
27. [Current implementation snapshot](#27-current-implementation-snapshot)

---

## 27. Current implementation snapshot

Use this table to avoid re-planning work that already exists. Update when closing a phase PR.

| Phase | Scope | Status | Notes |
|-------|--------|--------|--------|
| **0** | Monorepo, CI, PWA skeleton | **Done** | Turbo, Vitest, Playwright CI, `legacy/` archived |
| **1–2** | Engine, scoring, balance | **Done** | `docs/RULES.md`, golden fixtures, `sim-random`, analysis + threats |
| **3a** | Playable shell (functional UI) | **Done** | Routes, Zustand, board, keyboard, custom `Button`, **dark** gradient MVP |
| **3b** | Elite UI (layout + design system) | **Done** | Light theme, `PlayLayout`, settings sheet, home/endgame — see UI elite plan |
| **4** | Threats, inventory UX, endgame | **Done** | Click flow, insights, ledger, end screen polish |
| **5** | Replay, persistence, modes | **Done** | Export/import, resume, local 2P / vs bot, sandbox query |
| **6** | Bot + worker search | **Done** | `bot.worker.ts`, compound moves, difficulty budgets |
| **7** | Online (PartyKit) | **Deferred** | Out of current product scope; ADR-003 remains reference |
| **8** | Arena (ranked) | **Partial** | Local clock / opening swap preview — see `docs/ARENA.md`; no backend |

**Verify locally:** `pnpm test`, `pnpm build`, `pnpm test:e2e` (PWA offline test optional via `PWA_E2E=1`).

**Active priority:** Maintenance, balance/AI tuning, or **Phase 7/8** when re-scoped — not required for local Classic.

---

## 0. Pre-flight sign-off

Do **not** start **Phase 3b** (visual elite pass) until engine scoring is trusted. **Phase 3a** shipped on a validated engine (see §27).

| # | Decision / artifact | Owner | Status |
|---|---------------------|-------|--------|
| 0.1 | Shared diagonals for **both** players (8 lines each) | Design | ☑ |
| 0.2 | Coexistence scoring (+1 at level R and +1 at level D when ≥2) | Design | ☑ |
| 0.3 | Lexicographic winner + explicit **draw** at full tie | Design | ☑ |
| 0.4 | `docs/RULES.md` drafted from §2 | Eng | ☑ |
| 0.5 | ADR-001 rules constitution merged | Eng | ☑ (file exists; merge status per team) |
| 0.6 | Replay schema `numchess-replay/v1` + `rulesVersion` policy (ADR-005) | Eng | ☑ |
| 0.7 | Threat UX labeled **heuristic** (not official rules) | Product | ☑ (UI copy + docs) |
| 0.8 | OD-1…OD-7 in §24 reviewed (or explicitly deferred) | Product | ☐ |
| 0.9 | Engine dev strategy chosen: **Vite alias → `engine/src`** (recommended) or tsup watch | Eng | ☑ |

---

## 1. Vision and success criteria

### 1.1 What “elite” means for Numchess

| Area | Prototype today | Elite target |
|------|-----------------|--------------|
| **Rules** | Implicit; diversity partially dropped in scoring | Written spec + engine that matches spec exactly |
| **State** | DOM is source of truth | Pure `GameState`; UI is a projection |
| **UX** | Buttons on a table | Responsive board, inventories, line highlights, endgame breakdown |
| **Trust** | Console logs | 200+ unit tests, golden fixtures, property tests, replay verification |
| **Polish** | Minimal CSS | Motion, sound (optional), **light** product theme, tutorial, PWA install |
| **Growth** | Single HTML file | Modular app, deployable, room for AI and online |

### 1.2 Definition of done (MVP — Numchess Classic shipped)

- [x] **Local pass-and-play** on one device.
- [x] Both inventories enforced; illegal moves rejected in engine (`Result` type).
- [x] End screen shows **line ledger**, **level counts (2–5)**, **lexicographic winner**, and **draw** if fully tied.
- [x] **Shared diagonals** scored for both players (8 scoring lines each).
- [x] **(R, D) coexistence** scoring per line, capped at Level 5.
- [x] Settings persist via `localStorage` (sound, motion, labels, arena preview options).
- [x] Replay: export/import JSON; scrubber in UI.
- [x] **PWA:** installable; offline shell (E2E optional).
- [x] `pnpm test` + typecheck in CI; `pnpm build` artifact.
- [x] Keyboard: roving tabindex on board grid.

**Remaining for “Classic elite” feel:** optional Storybook; CI runs Lighthouse a11y ≥90 on `/play`.

### 1.3 Definition of done (Numchess Ultimate — v1.1)

Everything in Classic, plus:

- [x] Partial line **(R, D)** / threat bands in UI (heuristic).
- [ ] Post-game **pattern collapse** annotations in replay (stretch).
- [x] Local **bot** via Web Worker + search (`vs bot` mode).
- [x] Interactive **tutorial** (Driver.js; skippable in E2E via localStorage).
- [ ] **Classic+ Reserve** variant behind `GameConfig` flag (one held tile, max one turn).

---

## 2. Canonical rules (lock before coding)

Implement as `docs/RULES.md` (player-facing) and `packages/engine/src/constants.ts` + `patterns.ts`. **Do not start UI until §2.1–2.4 are signed off (§0).**

### 2.1 Scoring lines

| Player | Primary lines | Shared |
|--------|---------------|--------|
| **Player 1 (Rows)** | 6 horizontal rows | Both main diagonals (↘ and ↙) |
| **Player 2 (Columns)** | 6 vertical columns | Both main diagonals (↘ and ↙) |

Each player evaluates **8 lines** at game end. Scoring runs **only when all 36 cells are filled** (no mid-game scoring in Classic).

**Index mapping (0–35, row-major):**

- Row `r`, col `c`: `index = r * 6 + c`
- ↘ diagonal: indices `0, 7, 14, 21, 28, 35`
- ↙ diagonal: indices `5, 10, 15, 20, 25, 30`

### 2.2 Per-line pattern profile

For a **full** line of 6 cells (values 1–5 only):

```text
R = min(5, max frequency of any value 1..5)
D = min(5, count of distinct values among {1,2,3,4,5} present in the line)
```

**Contributions to that player’s level buckets** (coexistence):

- If `R >= 2`: add **+1** to Level `R`
- If `D >= 2`: add **+1** to Level `D`
- If `R === 1` or `D === 1`: **no** contribution from that dimension (Level 1 is not scored)

| Line | R | D | Adds |
|------|---|---|------|
| `1 1 2 3 4 5` | 2 | 5 | +1 L5 (diversity), +1 L2 (repetition) |
| `3 3 3 3 3 2` | 5 | 2 | +1 L5 (repetition), +1 L2 (diversity) |
| `1 1 1 1 1 1` | 5 (capped) | 1 | +1 L5 (repetition) only |

**Six-of-a-kind:** globally at most six copies of `1` exist; one row may be six `1`s → `R = 5`, `D = 1` after cap rules above.

### 2.3 Winner (lexicographic)

After summing contributions across all 8 lines for each player:

```text
Compare Level 5 counts (P1 vs P2)
  if unequal → higher wins
  else compare Level 4
  else compare Level 3
  else compare Level 2
  else → Draw
```

Display all level counts on the end screen even when a higher level decides the game.

**Ranked optional tiebreak (Arena only, not Classic):** if draw at all levels, compare total “pattern events” `(L5 count sum of both channels)` then L4… — document in ADR if enabled.

### 2.4 Match fairness (match layer, not core `GameState`)

- **Casual:** fixed seats (P1 = Rows, P2 = Columns).
- **Best-of-2 / ranked:** swap roles in game 2.
- **Opening swap (optional):** after P1 completes first **placement** (select+place), P2 chooses keep roles or swap Rows/Columns — implemented in `MatchConfig` + UI flow.

**Engine role mapping:** store perspectives in config, not in player seat id:

```typescript
interface GameConfig {
  player1Perspective: 'rows'; // always rows for seat 1 in Classic
  player2Perspective: 'columns';
  variant: 'classic' | 'classic-reserve';
  // match layer may swap which human sits in seat 1 vs 2 without changing perspectives
}
```

Scoring functions take `(state, perspective: 'rows' | 'columns')` so opening swap only remaps UI labels and “your lines” overlays.

### 2.5 Inventory (Classic)

Per player: `1×3, 2×4, 3×4, 4×4, 5×3` (18 tiles). Global totals on full board: 6×1, 8×2, 8×3, 8×4, 6×5.

### 2.6 In-game analysis (Ultimate UX — not scoring rules)

For **partial** lines during play (empty cells present):

- Consider **filled cells only** when computing display `(R, D)` for tooltips/threats.
- Empty cells do not count as distinct values.
- Threat “Critical” may require checking **remaining tiles in both inventories** (ghost threats) — see Phase 4.

---

## 3. Architecture

### 3.1 Principle: engine first, UI second

```text
                    ┌─────────────────┐
                    │   UI (React)    │
                    │  board, HUD,    │
                    │  replay, settings│
                    └────────┬────────┘
                             │ dispatch(action)
                             ▼
                    ┌─────────────────┐
                    │  Game controller │
                    │  (thin adapter)  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│ LegalMoves   │◄───│    GameState    │───►│ LineAnalyzer │
└──────────────┘    │ board[36]       │    │ Pattern (R,D)│
                    │ inventories     │    │ LevelAgg     │
                    │ phase, history  │    │ WinnerEval   │
                    └─────────────────┘    └──────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
     ┌─────────────────┐           ┌─────────────────┐
     │ Vitest + fast-check│         │ Web Worker (AI) │
     │ golden + sim     │         │ same engine API │
     └─────────────────┘           └─────────────────┘
```

- **`@numchess/engine`:** zero React/DOM imports; ESM; consumable from Node, Vitest, Web Workers, PartyKit server.
- **`@numchess/replay`:** Zod schemas + JSON types shared by web and server (no engine dependency required for parse-only).
- **`apps/web`:** React SPA; never mutates board without `applyAction`.

### 3.2 State shape (TypeScript)

```typescript
type CellValue = 1 | 2 | 3 | 4 | 5 | null;

interface Inventory {
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
}

type Phase =
  | { kind: 'select'; player: 1 | 2 }
  | { kind: 'place'; player: 1 | 2; selected: 1 | 2 | 3 | 4 | 5 }
  | { kind: 'ended'; result: GameResult };

interface GameState {
  board: CellValue[]; // length 36
  inventories: [Inventory, Inventory];
  phase: Phase;
  ply: number; // completed placements 0..36
  history: GameAction[];
  config: GameConfig;
}

type GameAction =
  | { type: 'SELECT'; value: 1 | 2 | 3 | 4 | 5 }
  | { type: 'PLACE'; index: number }
  | { type: 'RESERVE_HOLD' }
  | { type: 'RESERVE_PLAY'; index: number };

type GameResult =
  | { outcome: 'win'; winner: 1 | 2; levels: LevelCountsPair; decisiveLevel: 2 | 3 | 4 | 5 }
  | { outcome: 'draw'; levels: LevelCountsPair };
```

Use **`Result<GameState, IllegalMoveReason>`** from `applyAction` — do not throw for illegal player actions (only assert in dev-only internal paths).

### 3.3 Pure functions (public API)

| Function | Responsibility |
|----------|----------------|
| `createInitialState(config?)` | Empty board, full inventories, phase `select`, player 1 |
| `getLegalActions(state)` | Discriminated union for UI / AI |
| `applyAction(state, action)` | Immutable next state; `Result` |
| `analyzeLine(cells: (1\|2\|3\|4\|5)[])` | `{ R, D, frequencies, contributions }` |
| `scorePlayer(lines, player)` | Level 2–5 counts + per-line ledger |
| `evaluateGame(state)` | Requires full board; winner + ledger |
| `getScoringLines(player)` | 8 line index arrays |
| `analyzePosition(state, perspective)` | Partial (R,D), threat bands — UI module |
| `hashState(state)` | Stable string for replay checksum (optional) |

### 3.4 Event log and replay

**`GameIR`** (stored in `@numchess/replay`):

```typescript
interface ReplayFile {
  schema: 'numchess-replay/v1';
  rulesVersion: string; // semver of @numchess/engine
  config: GameConfig;
  actions: Array<{ ply: number; player: 1 | 2; action: GameAction }>;
  meta?: { createdAt: string; appVersion: string };
}
```

Replay verification: fold `applyAction` from `createInitialState(config)`; compare `evaluateGame` to stored result if present.

**Import safety:** max file size 256KB; Zod parse; reject unknown `schema` with user-visible error.

### 3.5 Version axes (do not conflate)

| Axis | Example | When it bumps |
|------|---------|----------------|
| **`@numchess/engine` semver** | `1.2.3` | Public API / bugfix per [SemVer](https://semver.org/) |
| **`rulesVersion` in replay** | `"1.0.0"` | Any change to **scoring or legality** that alters outcomes on the same action list |
| **Replay `schema`** | `numchess-replay/v1` | Breaking change to ReplayFile JSON shape (rare; prefer additive fields) |

**Rules change policy:** Never silently change scoring for an existing `rulesVersion`. Copy logic → new version id (e.g. `RULES_V1`, `RULES_V2`), register both; replays store `rulesVersion` and engine selects evaluator ([immutable shipped rules pattern](https://eigeninteractive.com/docs/build-a-game/versions)). Classic MVP ships **`rulesVersion: "1.0.0"`** only.

**Engine changelog:** Maintain `packages/engine/CHANGELOG.md`; every `rulesVersion` bump requires entry + new golden fixtures.

**`@numchess/replay`:** Export `ReplayFileSchema`, `parseReplayFile(raw): Result`, `RULES_VERSION_LATEST` constant synced manually with engine release notes.

---

## 4. Technology stack

### 4.1 Core (recommended versions at bootstrap — pin in lockfile)

| Layer | Choice | Why |
|-------|--------|-----|
| Monorepo | **pnpm 9+ workspaces** + **catalog** for shared versions | Single React copy; [workspace pitfalls](https://www.ishchhabra.com/writing/pnpm-monorepo) |
| Node | **20 LTS or 22 LTS** | Match Vite `engines`; `.nvmrc` committed |
| Language | **TypeScript 5.x**, `strict: true` | Rules bugs are expensive |
| Bundler | **Vite 6+** (upgrade to **7/8** when plugins align) | HMR, Vitest; after major Vite bump run `vite --force` once |
| UI | **React 19** | Ecosystem; optional React Compiler later |
| Styling | **Tailwind CSS 4** | Tokens, `@theme`, **light-first** (see §16 + UI elite plan) |
| Components | **shadcn/ui** (Radix) | Dialog, tabs, tooltip, switch — copied in-repo |
| Client state | **Zustand 5 + Immer** | Game store; replay scrubber index |
| Routing | **TanStack Router** *or* **React Router 7** | Pick one at Phase 0; typed routes preferred |
| Validation | **Zod 3** | Replay + API |
| Animation | **Motion** | Tile place, line pulse |
| Icons | **Lucide React** | |
| Tutorial | **Driver.js** | |
| Audio | **howler.js** | SFX; mute via `Howler.mute()` |
| Fonts | **@fontsource/dm-sans** + **@fontsource/syne** | Self-host; tabular nums on tiles |
| PWA | **vite-plugin-pwa** | Offline shell; extend `globPatterns` for `woff2`, audio ([precache guide](https://github.com/vite-pwa/vite-plugin-pwa/blob/main/docs/guide/service-worker-precache.md)) |

### 4.2 Monorepo wiring (critical)

1. **`@numchess/engine`:** `"type": "module"`. **Production build:** [`tsup`](https://tsup.egoist.dev/) (simple ESM + `--dts`) or [`unbuild`](https://unjs.io/packages/unbuild) for releases. Avoid `unbuild --stub` as the only dev path — ESM stub + Vite has known edge cases ([unbuild #35](https://github.com/unjs/unbuild/issues/35)).

2. **Recommended dev workflow (ADR-004):** In `apps/web/vite.config.ts`, alias `@numchess/engine` → `../../packages/engine/src/index.ts` so HMR hits source directly; CI/`turbo build` still emits `dist/` for PartyKit and npm-like consumers.

3. **`package.json` exports** (engine):

   ```json
   {
     "name": "@numchess/engine",
     "type": "module",
     "exports": {
       ".": {
         "types": "./dist/index.d.ts",
         "import": "./dist/index.js",
         "default": "./dist/index.js"
       }
     },
     "files": ["dist"]
   }
   ```

4. **`apps/web` dependency:** `"@numchess/engine": "workspace:*"`.

5. **React singleton:** `resolve: { dedupe: ['react', 'react-dom'] }` in Vite.

6. **Duplicate React:** if hooks break, use `dependenciesMeta.injected: true` on the engine dep ([pnpm injected](https://pnpm.io/package_json#dependenciesmetainjected)).

7. **pnpm catalog** in `pnpm-workspace.yaml` for shared versions (`typescript`, `vitest`, `react`, `zod`, `turbo`).

8. **Turborepo v2** — use `"tasks"` not deprecated `"pipeline"` ([Turbo tasks docs](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks)):

   ```json
   {
     "$schema": "https://turborepo.dev/schema.json",
     "tasks": {
       "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
       "test": { "dependsOn": ["build"], "outputs": ["coverage/**"] },
       "typecheck": { "dependsOn": ["^build"] },
       "lint": {},
       "dev": { "cache": false, "persistent": true }
     }
   }
   ```

   Root scripts: `"build": "turbo run build"`, `"test": "turbo run test"`, `"dev": "turbo run dev --filter=web"`.

9. **Optional:** pnpm native task graph in `pnpm-workspace.yaml` (`tasks.build.dependsOn: ^build`) if skipping Turbo — pick **one** orchestrator, not both ([pnpm tasks](https://pnpm.io/workspace-task-orchestration)).

### 4.3 Testing and quality

| Tool | Use |
|------|-----|
| **Vitest** | Engine unit tests (`environment: 'node'`) |
| **@fast-check/vitest** | Property + model-based tests ([fast-check Vitest guide](https://fast-check.dev/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-vitest/)) |
| **@vitest/coverage-v8** | ≥90% on `packages/engine` |
| **@testing-library/react** | Inventory, turn banner |
| **Playwright** | E2E play + replay + PWA smoke |
| **Lint/format** | **Biome** (`biome check --write` / `biome ci`) recommended for monorepo speed ([Biome monorepo guide](https://biomejs.dev/guides/big-projects/)); or ESLint 9 + Prettier if you need a niche plugin |
| **`tsc -b`** | CI typecheck (Vitest does not typecheck) |
| **Storybook 8** (optional) | Board/Cell states in isolation |
| **tsx** | Run `scripts/sim-random.ts` without compile step |

### 4.4 Optional later

| Tool | Use |
|------|-----|
| **PartyKit** on Cloudflare | Turn-based rooms, WebSocket, Durable Objects ([PartyKit docs](https://docs.partykit.io/how-partykit-works/)) |
| **Upstash Redis + REST** | Alternative if avoiding WebSockets (higher latency) |
| **Supabase** | Accounts, ELO, stored replays |
| **Sentry** | Client + server errors |

### 4.5 Explicitly avoid

- Phaser / Three.js for core UI
- **pureboard** unless adopting full replicated-action multiplayer model
- DOM-as-source-of-truth for rules
- **`aria-activedescendant`** for board grid (prefer **roving tabindex** — VoiceOver issues on grids, [Zell Liew](https://zellwk.com/blog/element-focus-vs-aria-activedescendant/))

---

## 5. Repository layout

```text
numchess/
├── apps/
│   ├── web/                       # Vite + React
│   └── party/                     # Phase 7: PartyKit server (optional folder until then)
├── packages/
│   ├── engine/
│   │   ├── CHANGELOG.md         # rulesVersion + API changes
│   │   └── ...
│   ├── replay/                    # Zod schemas, ReplayFile types
│   └── tsconfig/                  # shared tsconfig bases (optional)
├── scripts/
│   ├── sim-random.ts              # N random games, draw rate, throw on error
│   ├── sim-openings.ts            # opening frequency (Phase 2+)
│   └── verify-replay.ts           # CLI replay validator
├── docs/
│   ├── RULES.md
│   ├── ARCHITECTURE.md
│   └── BALANCE.md              # sim-random outputs (Phase 2)
├── adr/
│   ├── 001-rules-constitution.md
│   ├── 002-shared-diagonals.md
│   ├── 003-multiplayer-partykit.md
│   └── 005-rules-versioning.md
├── biome.json                    # or eslint.config.js
├── CONTRIBUTING.md
├── .github/workflows/ci.yml
├── legacy/index.prototype.html
├── NUMCHESS_DESIGN_DOCUMENT.md
├── IMPLEMENTATION_PLAN.md
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── turbo.json                     # build, test, lint pipelines
```

---

## 6. Phase 0 — Project bootstrap

**Goal:** Monorepo builds, engine testable, web serves placeholder.

### Tasks

1. pnpm workspace + catalog; `packages/engine`, `packages/replay`, `apps/web`.
2. Shared `tsconfig` strict; path aliases only in apps, not in engine public API.
3. Engine build tool (`tsup`) emitting ESM + types.
4. Vitest in engine; one smoke test; `@fast-check/vitest` installed.
5. Vite React app; alias `@numchess/engine` → `packages/engine/src` (ADR-004); `resolve.dedupe` for React.
6. **Biome** (root `biome.json`) or ESLint + Prettier; **`pnpm typecheck`** at root via `turbo run typecheck`.
7. **`turbo.json`** with `tasks` (see §4.2); root scripts wired to Turbo.
8. GitHub Actions: `pnpm install --frozen-lockfile` → `biome ci` or `lint` → `turbo run typecheck test build --filter=...@numchess/engine` → `tsx scripts/sim-random.ts --games 100 --seed 42` (stub script OK) → `turbo run build --filter=web`.
9. Move `index.html` → `legacy/index.prototype.html`; root **README** (`pnpm dev`, `pnpm test`, architecture link).
10. `.nvmrc` (e.g. `22`), `.editorconfig`; ADRs 001–004 present.
11. **vite-plugin-pwa** minimal manifest; `globPatterns`: `**/*.{js,css,html,ico,png,svg,woff2,mp3}`.
12. **`CONTRIBUTING.md`:** branch naming, “engine tests required for rule changes”, link §0 pre-flight.

### Acceptance

- `pnpm test` green; `pnpm build` outputs `apps/web/dist`.
- Import `@numchess/engine` from web without duplicate React warnings.

**Estimate:** 2–3 days.

---

## 7. Phase 1 — Rules spec and engine core

**Goal:** Legal move generation and immutable transitions.

### Tasks

1. Finalize `docs/RULES.md` from §2; link in app.
2. `constants.ts`, `lines.ts`, `types.ts`, `moves.ts`, `state.ts`.
3. `createInitialState`, `getLegalActions`, `applyAction` with `Result`.
4. Turn order: P1 select→place, P2 select→place, … 36 placements.
5. On last placement: `phase.kind === 'ended'` with placeholder result until Phase 2.
6. Unit tests: inventory, occupancy, alternation, illegal cases.
7. **Property test:** random legal action sequences never throw; board has 0–36 filled cells; inventory sums + board counts match global totals at end.
8. **Reserve variant (stub):** `GameConfig.variant === 'classic-reserve'` adds phase transitions documented in `docs/RULES.md` appendix — implement fully in Ultimate v1.1, but reserve `GameAction` types now to avoid replay schema churn.

### Acceptance

- 40+ tests + at least 2 `test.prop` invariants.
- `getLegalActions` count sanity: early game ~5–18 selects; place phase exactly one per empty cell.

**Estimate:** 3–5 days.

---

## 8. Phase 2 — Scoring, winner, balance, and invariants

**Goal:** Correct Classic outcome + confidence in fairness.

### Tasks

1. `patterns.ts`: `analyzeLine`, contributions array per line.
2. `scoring.ts` + `winner.ts`: lexicographic + draw.
3. Golden fixtures (Appendix A + diagonal-heavy boards).
4. **Regression:** 2–3 full 36-move replays with expected level counts.
5. **`scripts/sim-random.ts`:** 10k random games — no throws; log draw rate, P1 win rate (Rows).
6. **Balance gate:** if P1 wins >55% at random vs random, document bias and enable opening swap in match config for ranked (do not change inventory without ADR).
7. Prototype divergence documented in RULES changelog.
8. Export `evaluateGame` + `scorePlayer` for UI ledger.

### Acceptance

- ≥90% coverage on patterns/scoring/winner.
- CI runs `sim-random` with fixed seed in PRs (fast subset: 500 games).

**Estimate:** 4–7 days.

---

## 9. Phase 3 — UI shell (3a done) + Elite polish (3b)

**Goal:** Playable Classic on the correct engine, then a **light**, layout-first product UI.

### Phase 3a — Functional shell (**complete**)

Shipped in `apps/web` (see §27):

1. Tailwind `@theme` with player accents; **temporary dark page gradient** (to be replaced in 3b).
2. Single-column play layout; inventories + board + insights.
3. **Board:** grid, keyboard roving tabindex, ARIA grid roles, `data-testid` contract for E2E.
4. Custom `components/ui/Button.tsx`; home → `/play`; hand-rolled `RulesDialog`.
5. Place animation; `prefers-reduced-motion` respected where implemented.
6. Zustand → `applyAction`; end screen with levels + ledger.
7. PWA + CI E2E smoke.

**3a acceptance (met):** pass-and-play; replay E2E; keyboard path documented in `docs/ACCESSIBILITY.md`.

### Phase 3b — Elite UI (**complete** — see [UI elite plan](docs/UI_ELITE_IMPLEMENTATION_PLAN.md))

**Authoritative detail:** [docs/UI_ELITE_IMPLEMENTATION_PLAN.md](docs/UI_ELITE_IMPLEMENTATION_PLAN.md)

Summary:

1. **Light-only** token sheet; remove dark gradient / glass-on-black.
2. **PlayLayout** — desktop 3-column “game table”; mobile sticky banner + chip row + sheet settings.
3. **shadcn/ui** primitives; migrate `RulesDialog`, settings, mode toggles.
4. Extract `Board`, `TurnBanner`, `EndScreen`; shrink `PlayPage` to composition.
5. Lighthouse a11y ≥90 after visual pass; keep E2E `data-testid`s stable.

**3b estimate:** ~10–15 days (phases A–D in UI plan).

### Phase 3 — shadcn/ui + Tailwind v4 recipe (3b — follow in order)

Official reference: [shadcn Vite installation](https://ui.shadcn.com/docs/installation/vite).

1. `pnpm add tailwindcss @tailwindcss/vite` in `apps/web`.
2. `apps/web/src/index.css`: `@import "tailwindcss";` (+ `@theme` tokens); **no** legacy `tailwind.config.js` required for v4.
3. `vite.config.ts`: `plugins: [react(), tailwindcss()]`; aliases `@` → `./src` **and** `@numchess/engine` → engine src (ADR-004).
4. Put `paths` `@/*` in **`tsconfig.json` and `tsconfig.app.json`** (Vite split config — CLI reads references).
5. `pnpm dlx shadcn@latest init` (or `init -t vite`); add `button`, `dialog`, `tabs`, `tooltip`, `switch`.
6. If shadcn init fails preflight: confirm `@tailwindcss/vite` in plugins and `@` alias in **both** tsconfig files ([shadcn #10135](https://github.com/shadcn-ui/ui/issues/10135)).
7. Add `data-testid="app-shell"` on root layout for PWA E2E (§15.3).

---

## 10. Phase 4 — Gameplay UX (threats, inventory, endgame)

**Goal:** Design-doc depth visible; no rule changes.

### Tasks

1. Inventory dots; disabled at 0; animate consume.
2. Two-step UX: select tile → place; Esc cancels selection.
3. Partial `(R,D)` on hover for **current player’s 8 lines** (filled cells only).
4. **Threat bands** (document algorithm in `analysis.ts` header):
   - **Building:** one step away from higher R or D on a line player scores.
   - **Threat:** opponent could complete line advantage next ply (simplified).
   - **Critical:** achievable L5 repetition or L5 diversity for **some** player given **combined** remaining inventory (ghost threat if not).
5. Endgame: line ledger expandable; decisive level callout.
6. Line overlay toggles (rows / cols / diagonals).

### Acceptance

- Usability checklist: new player explains win reason from end screen.
- Unit tests for 5+ threat fixtures (including ghost threat).

**Estimate:** 6–10 days.

---

## 11. Phase 5 — Modes, undo, replay, persistence

**Goal:** Modes + learnability.

### Game modes (same engine)

| Mode | Description |
|------|-------------|
| **Local 2P** | Pass-and-play (default) |
| **Vs bot** | Phase 6 bot; human chooses seat |
| **Sandbox** | Dev-only: jump to board editor fixture (flag) |

### Tasks

1. Casual **undo** (1 step or full stack) — dev/casual flag only; disabled in ranked online.
2. Record `history`; export ReplayFile JSON (download + clipboard).
3. Replay route: scrubber, step ply, show inventories.
4. `localStorage`: `numchess-settings` + optional `numchess-resume` (single active casual game).
5. Zod validation on import; toast on failure.
6. Playwright: 4 plies → export → import → same board.

### Acceptance

- Replay reproduces `evaluateGame` exactly.

**Estimate:** 4–6 days.

---

## 12. Phase 6 — AI and analysis

**Goal:** Solo practice without blocking main thread.

### Architecture

```text
Main thread: UI + dispatch
     postMessage(state, timeBudget)
Web Worker: import @numchess/engine
     negamax + alpha-beta + iterative deepening
     return { action: GameAction }
```

### Search notes (Numchess-specific)

- **Branching:** ~5 tile choices × ~empty cells → worst case ~30–180 plies early; narrows in endgame.
- **Plies:** one full turn = select + place (two actions) — search must simulate **both** phases or collapse into composite moves `(value, index)` for ~18×36 legal pairs per turn (cleaner for AI: **`getLegalCompoundMoves`** helper in `engine/ai.ts`).
- **Algorithm:** negamax, alpha-beta, **iterative deepening** with time cutoff ([minimaxer](https://www.npmjs.com/package/minimaxer) as reference or custom ~200 LOC).
- **Move ordering:** prioritize cells on high `(R,D)` partial lines for mover; deny opponent L5 threats.
- **Eval (non-terminal):** difference of weighted level potentials for Rows vs Columns perspectives; exact `evaluateGame` at depth 0 when board full.
- **Transposition table (optional v1.1):** hash `board + inventories + phase + player` to reuse subtrees in endgame (36 cells → table stays small).
- **Difficulty:** time budget (200ms / 800ms / 2s) + eval noise for easy; **iterative deepening** returns best move so far on timeout.

### Tasks

1. `getLegalCompoundMoves(state)` for current player (if select phase, expand selects then places — or search from select phase only with two-ply alternation).
2. Worker bundle via Vite `?worker` import.
3. Post-game static analysis from ledger (no search).
4. `scripts/sim-bot-vs-random.ts`: medium bot win rate >80%.

**Estimate:** 8–14 days.

---

## 13. Phase 7 — Online multiplayer (optional milestone)

> **Product note (2026-09):** Phase 7 is **deferred**. Do not scaffold `apps/party` or online UI until explicitly re-scoped. Engine and replay packages remain PartyKit-ready.

**Goal:** Friend link play; authoritative rules.

### Recommended: PartyKit (primary)

- One **Party** per room id; state held in Durable Object ([how PartyKit works](https://docs.partykit.io/how-partykit-works/)).
- Server imports **`@numchess/engine`**; validates every action; broadcasts `{ state, lastAction }`.
- Client: `useGameRoom` pattern ([PartyKit starter](https://github.com/Swendude/partykit-starter)) — `dispatch` sends action, never local `applyAction` without server ack (optimistic UI optional with rollback).

### Fallback: Upstash + REST poll

- Lower complexity, worse UX latency; use only if WebSocket hosting blocked.

### Tasks

1. `apps/party` with turn order + seat tokens (Zod).
2. Reconnect via `sessionStorage` seat id.
3. Rate limit actions per IP (Cloudflare/WAF).
4. No ranked clock until Phase 8.

**Estimate:** 10–16 days.

---

## 14. Phase 8 — Numchess Arena (competitive)

- Clock ( Fischer or simple per-move ).
- Role alternation + opening swap enforced.
- ELO + optional Supabase auth.
- Public replays opt-in.
- Secondary tiebreak policy if draw rate >8% in sim (ADR required).

**Estimate:** 15+ days; product gate.

---

## 15. Testing strategy

### 15.1 Engine unit + property

| Layer | Technique |
|-------|-----------|
| Lines | Table tests Appendix A |
| Coexistence | Dual contributions same line |
| Winner | Lex + draw |
| Moves | Illegal rejected |
| **Property** | Random legal sequences preserve invariants ([@fast-check/vitest](https://www.npmjs.com/package/@fast-check/vitest)) |
| **Model** | Commands: Select, Place — `fc.modelRun` vs simplified inventory model |

### 15.2 Replay

- Golden ReplayFile JSON files in `packages/engine/__tests__/fixtures/replays/`.

### 15.3 UI + E2E

- RTL: inventory disabled when count 0.
- Playwright: full game smoke, replay, keyboard grid navigation once.

**PWA offline (Chromium project only):** Service worker APIs differ by browser; run in dedicated `projects: [{ name: 'chromium-pwa', use: { ...devices['Desktop Chrome'] } }]`.

```typescript
// Pattern: online prime → SW ready → offline reload (see Playwright PWA guides)
await page.goto('/play')
await page.waitForLoadState('networkidle')
await page.waitForFunction(() => navigator.serviceWorker?.controller != null)
await context.setOffline(true)
await page.reload()
await expect(page.getByTestId('app-shell')).toBeVisible()
```

References: [Playwright offline/cache testing](https://qaskills.sh/blog/playwright-offline-mode-cache-testing), [PWA SW testing overview](https://scrolltest.com/playwright-service-worker-pwa-testing/).

Do **not** use `serviceWorkers: 'block'` in PWA tests (blocks registration under test).

### 15.4 CI tiers

| Trigger | Jobs |
|---------|------|
| PR | lint, typecheck, engine test, sim-random 500 seed=42, build |
| main | + Playwright, sim-random 10k nightly (scheduled workflow) |

---

## 16. Design system and visual direction

**Theme:** **Light mode only** for v1 — warm off-white page, white/near-white panels, dark primary text. No dark shell, no `prefers-color-scheme` toggle unless requested later.

- **Syne:** wordmark, endgame headline.
- **DM Sans + `tabular-nums`:** tiles, scores, clocks.
- **OKLCH tokens** in `@theme` for surfaces, borders, player accents (rows cool / cols warm), placement highlight, threat bands — tuned for **light** backgrounds.
- **Color-blind safe:** value patterns on tiles 1–5 (`value-pattern-*` in CSS); threat labels/icons, not hue alone ([WCAG 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)).
- **Layout & components:** follow [UI elite plan](docs/UI_ELITE_IMPLEMENTATION_PLAN.md) §4–§6 (shadcn, `PlayLayout`, chip inventories).
- **Assets:** [Kenney UI Audio](https://kenney.nl/assets/ui-audio) or similar; attribute in README.

---

## 17. Audio, accessibility, and performance

### Audio

- howler sprites optional; unlock on first tap; settings persist mute.

### Accessibility (board)

- **Roving tabindex** on gridcells ([W3C APG](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)).
- Arrow keys move focus; **Enter** activates (place or select focused tile via secondary toolbar).
- Number keys 1–5 select inventory when legal.
- Live region for turn changes (`aria-live="polite"`).
- Do not rely on color alone for player turn.

### Performance budgets

- Main bundle (gzip): target **<250KB** excluding fonts (monitor in CI with `vite-bundle-visualizer` optional).
- `analyzePosition` debounced 50ms; run in `requestIdleCallback` when available.
- AI in Worker only.

---

## 18. DevOps, deployment, and quality gates

### CI (`.github/workflows/ci.yml`)

```yaml
# Steps: checkout → pnpm install --frozen-lockfile → lint → typecheck
# → pnpm --filter @numchess/engine test → pnpm exec tsx scripts/sim-random.ts --games 500 --seed 42
# → pnpm --filter web build
```

### Deploy

- **Cloudflare Pages** (preferred if using PartyKit) or Vercel for static `apps/web`.
- PartyKit deploy separate (`npx partykit deploy`) when Phase 7 ships.
- Preview URL per PR.

### Versioning

- `@numchess/engine` semver bump on any scoring rule change.
- Replay `rulesVersion` must match for ranked imports; casual may warn-only on mismatch.

---

## 19. Migration from prototype

1. Archive prototype to `legacy/`.
2. RULES changelog entries for split diagonals + diversity `pop()` bug.
3. Optional test: `legacy-scorer.fixture.test.ts` documents old wrong totals (prevent revert).

---

## 20. Timeline and staffing

| Milestone | Phases | Calendar (1 FTE) |
|-----------|--------|------------------|
| M0 Engine correct + balance sim | 0–2 | Weeks 1–3 |
| M1 Classic elite UI + PWA | 3–5 | Weeks 4–8 |
| M2 Bot + tutorial | 6 | Weeks 9–11 |
| M3 Online | 7 | **Deferred** |
| M4 Arena | 8 | TBD (local preview only today) |

Designer parallel: **Phase 3b** mocks — play desktop/mobile, end screen, home (see UI elite plan §11).

---

## 21. Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Rules drift | Wrong winner | Single engine; UI never writes board |
| Row player bias | Unfair ranked | `sim-random` gate; opening swap; role swap |
| Duplicate React in monorepo | Broken hooks | dedupe + injected deps |
| Threat UX wrong | Distrust | Label heuristic; tests; no auto-move |
| Replay schema drift | Broken shares | rulesVersion + Zod |
| AI blocks UI | Jank | Web Worker only |
| PWA stale cache | Old rules | `registerType: 'autoUpdate'` + prompt |
| Online cheating | Invalid state | Server `applyAction` only |

---

## 22. Appendix — dependency reference

### Workspace packages

- `@numchess/engine` — rules, scoring, analysis, AI helpers
- `@numchess/replay` — zod + types

### Web app (illustrative)

```json
{
  "dependencies": {
    "react": "catalog:",
    "react-dom": "catalog:",
    "@numchess/engine": "workspace:*",
    "@numchess/replay": "workspace:*",
    "zustand": "^5.0.0",
    "immer": "^10.0.0",
    "motion": "^12.0.0",
    "howler": "^2.2.4",
    "zod": "catalog:",
    "lucide-react": "^0.500.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^3.0.0",
    "driver.js": "^1.3.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "vite-plugin-pwa": "^0.21.0",
    "tailwindcss": "^4.0.0",
    "vitest": "catalog:",
    "@fast-check/vitest": "^0.1.0",
    "fast-check": "^3.0.0",
    "@playwright/test": "^1.50.0",
    "typescript": "catalog:"
  }
}
```

Pin exact versions at Phase 0 bootstrap.

### Phase 7 add-on

- `partykit` dev dependency in `apps/party`

---

## 23. Architecture decision records (ADRs)

| ADR | Title | Status |
|-----|-------|--------|
| [001](adr/001-rules-constitution.md) | Rules constitution (§2) | Proposed |
| [002](adr/002-shared-diagonals.md) | Both diagonals for both players | Proposed |
| [003](adr/003-multiplayer-partykit.md) | PartyKit over REST poll | Proposed |
| [004](adr/004-engine-dev-vite-alias.md) | Vite alias to engine src in dev | Proposed |
| [005](adr/005-rules-versioning.md) | Immutable rulesVersion for replays | Proposed |

---

## 24. Open decisions (resolve before or during Phase 2)

| ID | Question | Options | Recommendation |
|----|----------|---------|----------------|
| OD-1 | Ranked tie after L2 tie | Draw / secondary tiebreak | Draw in Classic; tiebreak in Arena only |
| OD-2 | Optimistic UI online | On / off | Off until Phase 7 stable |
| OD-3 | Composite move AI API | Two-action vs `(value,index)` | `(value,index)` compound moves |
| OD-4 | Tile color by value | On / off / setting | On with pattern backup + setting |
| OD-5 | First player in casual | Always P1 / random | Always P1; random optional in settings |
| OD-6 | i18n | English-only v1 / later | English-only Classic MVP |
| OD-7 | Lint toolchain | Biome / ESLint+Prettier | Biome unless plugin gap |

---

## 25. Phase execution checklists

Use as PR descriptions when closing each phase.

### Phase 0 done when

- [x] `turbo run build test typecheck` green from clean clone
- [x] Web loads; engine import works; no duplicate React warning in console
- [x] PWA manifest present; lint in CI
- [x] ADR 001–005 files exist; README documents commands

### Phase 1–2 done when

- [x] `docs/RULES.md` matches §2
- [x] Property + golden tests green; fixtures committed
- [x] `sim-random` documented in `docs/BALANCE.md`

### Phase 3a–5 done when (functional MVP)

- [x] Keyboard grid + `docs/ACCESSIBILITY.md`
- [x] Replay export/import E2E green
- [x] Line ledger on end screen; threats + click-flow UX

### Phase 3b done when (elite UI)

- [x] Light tokens applied; no dark full-page gradient on `/` or `/play`
- [x] `PlayLayout` + component split per UI elite plan
- [x] Lighthouse a11y ≥90 on `/play` (`pnpm a11y` in CI)

### Phase 6 done when

- [x] Bot worker; difficulty budgets; `sim:bot` script

### Phase 7 done when (if re-scoped)

- [ ] Party room: two browsers play full game; refresh reconnects seat

---

## 26. Security and privacy (web)

| Topic | Guidance |
|-------|----------|
| **Replay import** | Zod + 256KB cap; no `eval`; no `innerHTML` with replay content |
| **Online API** | Rate limit; validate actions only via `@numchess/engine` on server |
| **CSP** (production) | `default-src 'self'`; allow fonts self + blob; script nonces or strict hashes if adding inline |
| **Secrets** | No API keys in client; PartyKit/Cloudflare env in CI only |
| **Privacy** | No analytics in MVP; if added later, ADR + consent banner |
| **localStorage** | Settings + casual resume only; no PII |

---

## Next step (recommended)

1. Play-test `/` and `/play` on phone + desktop; file issues for visual nits only.
2. Optional: `docs/design/` reference screenshots; Storybook for board cell states.
3. Re-scope **Phase 7** (online) or **Phase 8** backend (Arena) before new infra work.
