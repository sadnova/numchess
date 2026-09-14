# Strategic mode (8×8) — Implementation plan

**Status:** Planned  
**Scope:** `@numchess/engine`, `@numchess/replay`, `apps/web`, scripts/sims/e2e, docs  
**Parent:** [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md), [docs/RULES.md](./RULES.md), [adr/005-rules-versioning.md](../adr/005-rules-versioning.md)  
**Builds on:** [FLANKING_DIAGONALS_1_2_0_PLAN.md](./FLANKING_DIAGONALS_1_2_0_PLAN.md) (Classic **1.2.0**), [BOT_SPECTATOR_AND_LINE_CELEBRATION_PLAN.md](./BOT_SPECTATOR_AND_LINE_CELEBRATION_PLAN.md) (play modes — must work on Strategic)  
**Does not replace:** Classic remains default; Strategic is a **second board mode** with its own `rulesVersion`.

### Revision history

| Version | Changes |
|---------|---------|
| v1 | Product spec, geometry, L3–L6 scoring, phases |
| **v2** | **Codebase audit**; **feature parity matrix**; Classic **non-regression protocol**; replay schema blocker; **config propagation** map; expanded DoD/E2E; phase task detail |
| **v3** | **Second audit**: module-level `lines.ts` trap; **`boardMode` vs `variant`**; board-only vs state-aware APIs; **cold-start resume**; **import replay rules map**; expanded hotspots (AI, web lib, E2E); **CI `sim:random`** note; typing strategy for `LevelCounts` |
| **v4** | **Third audit**: partial-line **live** scoring; bot **center tiebreak** / **LEVEL_WEIGHT** / **TT hash**; threat **`canReachL5*`** refactor; **`TileValue`/`Inventory`** migration; replay **zod lockstep**; **`setBoardMode`** UX pattern; **`index.css`** tile 6 |

---

## Table of contents

0. [North star](#0-north-star)  
1. [Goals, parity & non-goals](#1-goals-parity--non-goals)  
2. [Product: Classic vs Strategic](#2-product-classic-vs-strategic)  
3. [Geometry on 8×8](#3-geometry-on-8×8)  
4. [Scoring & winner (Strategic)](#4-scoring--winner-strategic)  
5. [Inventories & globals](#5-inventories--globals)  
6. [Engine architecture & codebase audit](#6-engine-architecture--codebase-audit)  
7. [Web & UX (reuse map)](#7-web--ux-reuse-map)  
8. [Replay, resume, bot, balance](#8-replay-resume-bot-balance)  
9. [Classic non-regression protocol](#9-classic-non-regression-protocol)  
10. [Phase 0 — Design locks & ADR](#10-phase-0--design-locks--adr)  
11. [Phase A — Config & types](#11-phase-a--config--types)  
12. [Phase B — Lines & geometry](#12-phase-b--lines--geometry)  
13. [Phase C — Scoring & winner](#13-phase-c--scoring--winner)  
14. [Phase D — State, replay package](#14-phase-d--state-replay-package)  
15. [Phase E — Web shell & store](#15-phase-e--web-shell--store)  
16. [Phase F — Feature parity UI](#16-phase-f--feature-parity-ui)  
17. [Phase G — Bot, sims, bench](#17-phase-g--bot-sims-bench)  
18. [Phase H — Balance, docs, E2E](#18-phase-h--balance-docs-e2e)  
19. [Test catalog](#19-test-catalog)  
20. [Definition of done](#20-definition-of-done)  
21. [Risks & FAQ](#21-risks--faq)  
22. [File checklist (expanded)](#22-file-checklist-expanded)  
23. [PR strategy & estimates](#23-pr-strategy--estimates)  
24. [Execution checklist](#24-execution-checklist)

---

## 0. North star

**Classic** stays the shipped **6×6 / 1–5 / L2–L5** game (`rulesVersion` **1.2.0**), including everything already on `/play`: local 2P, vs bot, bot spectator, diagonal overlays, line insights, celebrations, replay, resume, arena clock, etc.

**Strategic** is the same **product surface** on a harder ruleset:

- **8×8**, values **1–6**, **13 lines/side**, contributions **L3–L6** (R≥3, D≥3), winner **L6→L3**

**Implementation principle:** parameterize from `GameState.config` (and `configForBoardMode()`), do **not** fork a second engine or second web app.

---

## 1. Goals, parity & non-goals

### 1.1 Core goals

| ID | Goal | Verify |
|----|------|--------|
| G1 | `boardMode` in settings + `GameState.config` | Persistence + new game |
| G2 | Strategic geometry (5 diags: 8/7/7/6/6) | Golden line tests |
| G3 | Strategic scoring floor R≥3, D≥3; cap 6 | `analyzeLine` tests |
| G4 | Winner L6→L5→L4→L3 | `compareLevelCounts` tests |
| G5 | **Classic 1.2.0 bit-identical behavior** | Full engine suite + Classic E2E |
| G6 | Replay/resume carry mode; no silent mix | Import/resume warnings |
| G7 | 8×8 grid + inventory **1–6** | Smoke E2E |

### 1.2 Feature parity goals (Strategic must match Classic play features)

| ID | Feature (Classic today) | Strategic requirement |
|----|-------------------------|---------------------|
| P1 | Local 2P | Same |
| P2 | Vs bot (easy/med/hard) | Same + Strategic bot presets |
| P3 | Bot vs bot + pause/pace | Same |
| P4 | Live score HUD + score feed | L6–L3 rows (no L2) |
| P5 | Line insights + threat bands | Mode-aware thresholds (top level 6) |
| P6 | Diagonal guide overlays | **10** diagonals drawn (5 per side) |
| P7 | Row/col/diag overlay toggles | Same settings keys |
| P8 | L4/L5 board celebration + SFX | **L5/L6** celebration band (see §4.5) |
| P9 | Undo, new game, opening swap / random first | Same |
| P10 | Replay export/import/review scrubber | Schema supports 8×8 + tile 6 |
| P11 | Casual resume (`saveResumeGame`) | Validate `config.boardMode` |
| P12 | Settings (audio, reduce motion, arena clock) | Same |
| P13 | Rules dialog | Classic + Strategic sections |
| P14 | Sandbox dev fixture | Optional `?board=strategic` fixture |
| P15 | Keyboard 1–5 (+ placement arrows) | Keys **1–6**; arrows use **dynamic** board size |

### 1.3 Non-goals (v1)

- Ranked / PartyKit  
- `classic-reserve` variant on Strategic (reserve rules stay Classic-only until specified)  
- Strategic bot golden puzzles (Classic puzzles unchanged)  
- ML / opening books  

---

## 2. Product: Classic vs Strategic

| | **Classic** | **Strategic** |
|---|-------------|---------------|
| **UI label** | Classic | Strategic |
| **Board** | 6×6 (36) | 8×8 (64) |
| **Tile values** | 1–5 | 1–6 |
| **`rulesVersion`** | `1.2.0` | **`2.0.0`** |
| **Lines / side** | **9** (6 + 3 diags) | **13** (8 + 5 diags) |
| **Scoring band** | L2–L5 (R≥2, D≥2) | L3–L6 (R≥3, D≥3) |
| **Winner** | L5→L4→L3→L2 | L6→L5→L4→L3 |
| **Default** | Yes | Opt-in |

**Settings:** `boardMode: "classic" | "strategic"` in `AppSettings`. Changing board mode or play mode → **new game** (existing pattern).

**Ship gate:** Default remains **Classic**; Strategic is opt-in so production users see no behavior change until they switch.

### 2.1 Settings vs `GameConfig` (do not conflate)

Today `GameConfig` is only `{ variant, rulesVersion }` (`packages/engine/src/constants.ts`). **`variant: "classic-reserve"`** is a future rules flag (reserve actions already exist in types/replay); it is **orthogonal** to board size.

| Layer | Field | Values | Notes |
|-------|--------|--------|--------|
| **App settings** | `boardMode` | `"classic" \| "strategic"` | New in `persistence.ts`; default **`classic`** |
| **Game state** | `config.boardMode` | same | Serialized in resume + replay |
| **Game state** | `config.variant` | `"classic" \| "classic-reserve"` | Only meaningful when `boardMode === "classic"` |
| **Game state** | `config.rulesVersion` | `1.2.0` / `2.0.0` | Must match `boardMode` via `configForBoardMode()` |

**`configForBoardMode("classic")`** → `rulesVersion: 1.2.0`, `boardSize: 6`, Classic scoring profile.  
**`configForBoardMode("strategic")`** → `rulesVersion: 2.0.0`, `boardSize: 8`, Strategic profile.

**Legacy data:** Resume/replay JSON without `boardMode` → treat as **`classic`** in `normalizeGameConfig()` (never infer from `rulesVersion` alone during migration).

Changing **board mode** or **play mode** in UI → **new game** (existing pattern in `GameModeControls`).

---

## 3. Geometry on 8×8

Index: `index = row * boardSize + col`. Reuse **`indicesWithRowMinusCol(k)`** / **`indicesWithRowPlusCol(k)`** (already in `lines.ts`; today fed implicit `BOARD_SIZE=6`).

### 3.1 Diagonal offset sets (parameterize)

| Mode | ↘ family (`row - col = k`) | ↙ family (`row + col = k`) |
|------|----------------------------|----------------------------|
| Classic | `k ∈ {-1, 0, 1}` | main `k = boardSize-1` (5 on 6×6), flanks ±1 |
| Strategic | **`k ∈ {-2,-1,0,1,2}`** | main **`k = 7`**, flanks **`6,8`** and **`5,9`** |

### 3.2 Line ids (Strategic — add two per side)

| id | Len |
|----|-----|
| `diag-se-ne2`, `diag-se-sw2` | 6 |
| `diag-sw-nw2`, `diag-sw-se2` | 6 |

Existing ids (`diag-se`, `diag-se-ne`, …) keep labels; lengths become 8/7 on 8×8.

### 3.3 Tests

- `getScoringLines(perspective, classicConfig).length === 9`  
- `getScoringLines(perspective, strategicConfig).length === 13`  
- Snapshot **indices[]** per line id for Strategic (like `flanking-diagonals.test.ts`)

---

## 4. Scoring & winner (Strategic)

### 4.1 Profiles (single source of truth on `GameConfig`)

```typescript
scoring: {
  minR: 2 | 3;
  minD: 2 | 3;
  cap: 5 | 6;
  tiebreakLevels: readonly (2|3|4|5|6)[];
  celebrationLevels?: readonly number[]; // web: Classic [4,5], Strategic [5,6]
}
```

### 4.2 `analyzeLine(cells, config)`

Classic profile unchanged. Strategic: caps 6, push contributions only if level ≥ 3.

### 4.3 API must pass config (critical — see §6.3)

Today **`scoreLinesFromBoard(board, perspective)`** and **`lineScoreDelta(prev, next)`** call `getScoringLines(perspective)` and `analyzeLine(cells)` **without** config. That will silently score Strategic boards with Classic lines/rules.

**Required signatures (v2):**

```typescript
getScoringLines(perspective, config): ScoringLine[]
analyzeLine(cells, config): LineAnalysis
scoreLinesFromBoard(board, perspective, config): ...
lineScoreDelta(prev, next, config): ...
liveScoreLeader(levels, config): ...
compareLevelCounts(rows, cols, config): ...
```

Call sites must use **`state.config`** (engine) or **`useGameStore(s => s.state.config)`** (web).

**State-aware vs board-only APIs (v3):**

| Function | Today | Target |
|----------|--------|--------|
| `scoreLiveLevels(state)` | Ignores config | Read **`state.config`** inside (no signature change) |
| `evaluateGame(state)`, `scoreBoth(state)` | Same | Same |
| `lineScoreDelta(prevBoard, nextBoard)` | No config | Add **`config`** arg (PlayPage only has boards in refs) |
| `scoreLinesFromBoard(board, perspective)` | No config | Add **`config`** (used by `lineCelebration.ts`, tests) |
| `celebrationsFromBoards(...)` | No config | Add **`config`** or pass `GameConfig` from store |

Bot path: **`ai-fast-score.ts`**, **`ai-ordering.ts`**, **`ai-eval.ts`**, **`ai-threat-map.ts`** must pass **`state.config`** (worker already sends full `GameState`).

### 4.4 Endgame

- `isLineComplete` already uses **line.indices** — OK.  
- `state.ts`: replace **`ply >= CELL_COUNT`** with **`ply >= cellCount(config)`** and **`emptyBoard(config)`**.  
- `assertBoardFullForScoring`: length === `cellCount(config)`.

### 4.5 Celebrations & audio (parity P8)

| Mode | Board FX trigger | Fanfare |
|------|------------------|---------|
| Classic | L4/L5 delta | `level_4`, `level_5_celebrate` |
| Strategic | **L5/L6** delta (same “top two tiers” spirit) | extend manifest **`level_6_celebrate`** or reuse L5 sting + pitch |

`lineCelebration.ts`: drive thresholds from `config.scoring.celebrationLevels`, not hardcoded `4 | 5`.

### 4.6 Partial-line live scoring (do not change semantics)

`scoreLinesFromBoard` (`scoring.ts`) scores **every non-empty prefix** along each line: it calls `getFilledLineCells` then **`analyzeLine(cells)` on partial sequences**, not only completed lines. That drives the **live HUD** and score feed deltas.

Strategic must use the **same pipeline** with `analyzeLine(cells, config)` so partial rows/cols/diags respect **R≥3 / D≥3** (no phantom L2 on incomplete lines). Endgame `scorePerspective` still requires **full** lines only.

Also thread config into **`linesNewlyCompleted`** / **`newlyCompletedEntries`** (bot completion bonuses use these today).

---

## 5. Inventories & globals

### 5.1 Strategic starting inventory (locked v1)

32 per player → **4,5,6,6,5,6** for values 1–6 (global 8,10,12,12,10,12 = 64).

### 5.2 Classic

Keep `STARTING_INVENTORY` / `GLOBAL_BOARD_TOTALS` as **classic profile** values; do not mutate.

### 5.3 Engine state (`state.ts` audit)

Today hardcoded:

- `cloneInventory()` → `STARTING_INVENTORY`  
- `getLegalActions` → values **`[1..5]`** only  
- `PLACE` bounds → **`CELL_COUNT`** module constant  

**Target:** `inventoryFor(config)`, `tileValuesFor(config)`, `cellCount(config)` used in `createInitialState`, `getLegalActions`, `applyAction`.

---

## 6. Engine architecture & codebase audit

### 6.1 What we reuse well

| Asset | Notes |
|-------|--------|
| `GameState.config` | Already on state; extend `GameConfig` |
| `indicesWithRowMinusCol/PlusCol` | Generalize with `boardSize` param |
| Bot v3 stack | `selectBotMove(state, …)` — reads state; update threat/eval for config |
| `getDiagonalGuideSpecs()` | Filters `getScoringLines` — auto-extends once lines parameterized |
| Play mode hooks | `useBotPlayer`, spectator, celebrations — pass config from store |
| Live scoring pipeline | Same functions after config param added |

### 6.2 Hardcoded 6×6 / 1–5 hotspots (must fix)

| Area | File(s) | Issue |
|------|---------|--------|
| Board size export | `constants.ts` | `BOARD_SIZE = 6`, `CELL_COUNT` |
| Lines | `lines.ts` | `getScoringLines(perspective)` no config; SW diag k values tied to 6 |
| Patterns / winner | `patterns.ts`, `winner.ts`, `types.ts` | Level unions **2–5** only |
| Scoring | `scoring.ts` | All `getScoringLines` / `analyzeLine` without config |
| State | `state.ts` | Inventory, legal values, ply cap, board length |
| Analysis / threats | `analysis.ts`, `ai-threat-map.ts` | `combinedInventoryCounts` **1–5**; **`canReachL5OnLine`** / **`classifyLineBand`** hardcode **L5** thresholds; `getScoringLines` |
| AI helpers | `ai-fast-score.ts`, `ai-ordering.ts`, `ai-hash.ts` | `BOARD_SIZE`; **center at 2.5**; hash **`v <= 5`**; bonuses use **L5** weights |
| AI weights | `ai-weights.ts` | **`LEVEL_WEIGHT` 2–5 only**; `weightedLevels` fixed four levels |
| Properties | `properties.test.ts` | `CELL_COUNT` |
| **Replay package** | `packages/replay/src/index.ts` | **`PLACE` index max 35**; tiles **1–5** only; config schema no `boardMode` |
| Web board | `Board.tsx` | `BOARD_SIZE` from engine constant |
| Web keyboard | `useBoardKeyboard.ts` | `BOARD_SIZE` constant |
| Web overlay | `LineCelebrationOverlay.tsx` | loop **`i < 36`** |
| Web inventory | `InventoryPanel.tsx` | **`TILES = [1..5]`** |
| Web replay UI | `ReplayScrubber.tsx` | `BOARD_SIZE`, `CELL_COUNT` |
| Web import | `lib/replay.ts` | Warns vs single `RULES_VERSION` only |
| Web store | `gameStore.ts` | `createInitialState()` default only on `newGame` |
| AI move quality | `ai-fast-score.ts`, `ai-ordering.ts` | `lineScoreDelta` / `getScoringLines` without config |
| AI eval | `ai-eval.ts` | `scoreLinesFromBoard` without config |
| Web line lookup | `apps/web/src/lib/lines.ts` | `findLineIndices` → `getScoringLines(p)` no config |
| PlayPage FX | `PlayPage.tsx` | `lineScoreDelta` without config; pulse regex **`L[2-5]`** |
| Celebrations | `lineCelebration.ts`, `useLineCelebrations.ts`, `spectatorTiming.ts` | Levels **`4 \| 5`** only; L6 hold/SFX not wired |
| Live score UI | `LiveScorePanel.tsx`, `LevelScoreCard.tsx`, `EndScreen.tsx`, `PostGameAnalysis.tsx` | Hardcoded **`LEVELS = [5..2]`**, copy “L5→L2” |
| Audio | `useGameAudio.ts` | `decisiveLevel` union **2–5**; L5 celebrate hook only |
| Keyboard | `useGameKeyboard.ts` | **`KEY_TO_TILE` 1–5** only |
| Tile chrome | `lib/tileStyles.ts` | No ring style for **6** |
| Replay import | `apps/web/src/lib/replay.ts` | Warns vs single **`RULES_VERSION`** (`1.2.0` only) |
| Cold start | `gameStore.ts` L22–23 | **`loadResumeGame()`** at module init — no settings/config match |
| Fixtures | `fixtures.ts` | `createSandboxState` / `createInitialStateWithFirstPlayer` ignore config |
| Properties | `properties.test.ts` | **`CELL_COUNT`** fill assertion — duplicate for Strategic |
| E2E | `e2e/replay.spec.ts` | **`readBoard` loops 36**; Classic cell indices in moves |

### 6.3 Config propagation order (recommended)

1. **`configForBoardMode()`** + extended **`GameConfig`**  
2. **`lines.ts`** + tests (no behavior change for Classic config)  
3. **`patterns.ts` / `winner.ts` / types**  
4. **`scoring.ts`** (+ thread config into all exports used by web)  
5. **`state.ts`**  
6. **`analysis.ts`**, **`ai-*`** (use `state.config.boardSize` or pass config)  
7. **`@numchess/replay`** schema  
8. **Web** reads `state.config` everywhere  

### 6.4 `BOARD_SIZE` export strategy

- Add **`cellCount(config)`**, **`boardSize(config)`** helpers.  
- Keep **`export const BOARD_SIZE = 6`** as **Classic default** for one release with JSDoc `@deprecated use boardSize(state.config)` OR remove after web migrated.  
- **Never** read module `BOARD_SIZE` inside engine logic that must support Strategic.

### 6.5 Rules version constants

```typescript
export const RULES_VERSION_CLASSIC = "1.2.0";
export const RULES_VERSION_STRATEGIC = "2.0.0";
// RULES_VERSION = RULES_VERSION_CLASSIC for backward compat in replay warn paths
```

ADR-005: add **`getGameConfigForRulesVersion(v: string): GameConfig | null`** for replay import (minimal evaluator map).

### 6.7 Module-level geometry trap (`lines.ts`) — **blocker for Phase B**

`indicesWithRowMinusCol` / `PlusCol` already accept **`k`**, but **`BOARD_SIZE` is baked into**:

- `rowIndices` / `colIndices` loops  
- **`indicesWithRowMinusCol` inner bounds** (uses module `BOARD_SIZE`, not a parameter)  
- **Module-load constants** `DIAG_SE`, `DIAG_SW`, … computed once for **6×6**

Passing `config` into `getScoringLines` alone is **insufficient** until:

1. **`boardSize` is a parameter** on `indicesWithRow*`, `rowIndices`, `colIndices`, `indexToRowCol`, `rowColToIndex`.  
2. **No frozen `DIAG_*` arrays** — build diagonal lines from **per-mode k-offset tables** (§3.1) inside `getScoringLines(perspective, config)` or `lineGeometry.ts`.  
3. **PR0 spike** must include (2), not only a signature change.

### 6.8 `LevelCounts` typing (Strategic has no L2)

Today: `Record<2 | 3 | 4 | 5, number>` (`types.ts`, `patterns.emptyLevelCounts`).

**Recommended (v3):**

- Store counts for **`2 | 3 | 4 | 5 | 6`** with Classic always **0** at unused levels, **or**  
- `LevelCounts = Record<number, number>` + **`tiebreakLevels(config)`** for winner/UI.

Winner (`compareLevelCounts`), `liveScoreLeader`, `weightedLevels` (`ai-weights.ts`), and web HUD must iterate **`config.scoring.tiebreakLevels`**, not a fixed `[5,4,3,2]` array.

### 6.9 Bot stack — mode-specific constants (Phase G, but design in Phase C)

| Location | Classic assumption | Strategic fix |
|----------|-------------------|---------------|
| `ai-fast-score.centerTiebreak` | Center **(2.5, 2.5)** for 6×6 | **`(boardSize - 1) / 2`** from `state.config` |
| `COMPLETE_BONUS` / `BLOCK_BONUS` | `LEVEL_WEIGHT[5]` + `[4]` | Top two **tiebreak** levels from config (L6/L5 on Strategic) |
| `contributionDeltaScore` | `LEVEL_WEIGHT[c.level]` | Include **L6** weight in profile |
| `hashGameState` | Inventory loop **`1..5`** | Loop **`tileValuesFor(config)`** |
| `blocksOpponentCritical` / ordering | `getScoringLines(p)` one arg | Pass **`state.config`** |

Worker (`bot.worker.ts`) needs **no API change** — fixes are engine-side once `GameState` carries full config.

### 6.10 `TileValue` and `Inventory` (type migration)

`TileValue = 1|…|5` and `Inventory.counts: Record<TileValue, number>` permeate engine + web (`types.ts`, `constants.ts`, replay zod).

**Approach (v4):**

1. Widen **`TileValue` to `1|…|6`**; Classic configs never **select** tile 6 (inventory 0).  
2. Replace hardcoded **`{ 1:0,…,5:0 }`** in `combinedInventoryCounts` with **`emptyCombinedCounts(config)`**.  
3. Runtime legality from **`tileValuesFor(config)`** — do not iterate module **`TILE_VALUES`** in mode-aware paths.  
4. Web: `InventoryPanel`, keyboard, tests — derive allowed keys from **`state.config`**, not a local `TILES` constant.

Optional: keep **`TILE_VALUES`** export as Classic default list with JSDoc deprecated (mirror `BOARD_SIZE`).

---

## 7. Web & UX (reuse map)

| Component / hook | Change |
|------------------|--------|
| `persistence.ts` | `boardMode`; default `classic` |
| `gameStore.newGame` | Accept **`config?: GameConfig`**; default `createInitialState(config)` |
| `PlayPage` | **`setBoardMode`** mirrors **`setGameMode`** (patch settings + `startNewGame`); pass `state.config` to `lineScoreDelta`, `onPlyScored` / celebrations |
| `GameModeControls` | Classic \| Strategic segment (`data-testid="board-classic"` / `board-strategic`) |
| `Board.tsx` | `boardSize` from `state.config`; **`max-w-[420px]`** → mode-aware (**~480px** for 8×8) |
| `index.css` | **`.value-pattern-6`** + `tileStyles` entry for tile **6** |
| `InventoryPanel` | `tileValuesFor(config)` |
| `LiveScorePanel` | Level rows from `config.scoring.tiebreakLevels` |
| `useGameKeyboard` | Dynamic size from state |
| `useBoardKeyboard` | Same |
| `diagonalGuides.ts` | `getScoringLines(..., config)` via state in PlayPage |
| `DiagonalGuidesOverlay` | Measure **`boardSize²`** cells |
| `LineCelebrationOverlay` | Dynamic cell count |
| `useLineCelebrations` / `lineCelebration.ts` | Config-driven levels |
| `useGameAudio` | Strategic L5/L6 fanfare policy |
| `useBotPlayer` | Already uses state in worker — OK once engine OK |
| `TurnBanner` / `EndScreen` / `PostGameAnalysis` / `LineLedger` | Dynamic decisive level display |
| `SettingsSheet` | Copy for Strategic overlays |
| `RulesDialog` | Two rule sets |
| `HomePage` | Mention Strategic mode |

**Mobile:** 8×8 use `minmax(36px, 1fr)` or `min(92vw, 480px)` — playtest in Phase F.

---

## 8. Replay, resume, bot, balance

### 8.1 Replay schema (blocker — do in Phase D with engine)

Current `@numchess/replay` **cannot** store Strategic plies:

- `PLACE.index` **max 35**  
- `tileValueSchema` **1–5** only  
- `config` lacks **`boardMode`**

**Plan:**

1. Extend **`numchess-replay/v1`** carefully **or** ship **`v2`** with migration note. Recommended: **v1 extension** if zod allows `index.max(63)` and `z.literal(6)` + `boardMode` on config (old replays remain valid Classic).  
2. `buildReplayFromState` already embeds `state.config` — ensure serialized config is complete.  
3. `stateAtReplayStep(file)` → `createInitialState(normalizeConfig(file.config))`.  
4. `importReplayJson`: warn if `rulesVersion` / `boardMode` mismatch app expectations; **reject** if engine cannot apply.

### 8.2 Casual resume

`saveResumeGame` persists full `GameState` including config. On load:

- If `settings.boardMode !== state.config.boardMode` → **discard resume** or prompt (pick: **discard + toast**).  
- Same for `rulesVersion`.

### 8.3 Bot & scripts

| Script | Flag |
|--------|------|
| `scripts/bench-bot-move.ts` | `--board strategic` |
| `scripts/sim-bot-vs-random.ts` | `--board strategic` |
| `scripts/sim-bot-vs-bot.ts` | `--board strategic` |

`searchOptionsForDifficulty(level, boardMode)` — Strategic: higher `timeMs`, tuned `searchTopK` / `maxDepth` (separate row in BALANCE.md).

Worker: no change if `GameState` carries config (verify `chooseBotMove` uses state throughout).

### 8.4 Balance (Phase H)

Random vs random 500+ on Strategic; bot vs random sanity; record in BALANCE.md. Classic sims **must** remain unchanged in same CI run.

**CI today (`.github/workflows/ci.yml`):** `pnpm sim:random` always uses default `createInitialState()` → **Classic-only regression**. Do **not** switch CI to Strategic until Classic job is explicit; add **`pnpm sim:random --board strategic`** (or separate script) in Phase H / optional nightly.

### 8.5 Replay import rules map (`apps/web/src/lib/replay.ts`)

Replace single check `rulesVersion !== RULES_VERSION` with:

- **`rulesVersionSupported(v)`** → true for `1.2.0` and `2.0.0`  
- **`normalizeGameConfig(file.config)`** → inject `boardMode` if missing  
- Warn on mismatch between **app settings `boardMode`** and imported file (offer load anyway + switch settings, or block — **recommend: load + patch settings + toast**)

After import, call **`evaluateGame`** only when board full — already correct; must use **`state.config`** inside scoring (§4.3).

### 8.6 Cold-start resume vs settings

`gameStore` initializes with **`loadResumeGame() ?? createInitialState()`** before React reads settings.

**Required behavior:**

1. **`normalizeGameConfig`** on parsed resume state.  
2. If **`settings.boardMode !== state.config.boardMode`** (after settings load in `PlayPage`) → **`clearResumeGame()` + `newGame({ config })`** + short toast (“Resume was Classic; starting fresh”).  
3. If **`board.length !== cellCount(config)`** → discard resume (corrupt).  
4. Optionally defer resume apply until settings hydrated (small refactor: don’t read resume at module top level).

### 8.7 Engine ↔ `@numchess/replay` schema lockstep

`packages/replay/src/index.ts` **duplicates** `GameConfig` shape in Zod and imports **`RULES_VERSION`** from engine for `RULES_VERSION_LATEST`.

**Rule:** Any PR that extends `GameConfig` in `constants.ts` must update replay **`gameActionSchema`** + **`config`** object in the **same PR** (Phase D). `buildReplayFromState` already assigns `config: state.config` — parsing must accept the superset.

**ADR-005** names `getRulesEvaluator(rulesVersion)`; implement as **`getGameConfigForRulesVersion`** returning full config (board size + scoring profile), used by `importReplayJson` and `stateAtReplayStep`.

---

## 9. Classic non-regression protocol

**Every PR** in this epic:

1. `pnpm --filter @numchess/engine test` — all existing tests pass with **`configForBoardMode("classic")`** explicitly where state is created.  
2. `pnpm build`  
3. E2E: **`e2e/vs-bot.spec.ts`**, **`e2e/bot-spectator.spec.ts`**, **`e2e/smoke.spec.ts`**, **`e2e/replay.spec.ts`** on **Classic** (default settings).  
4. No change to Classic **`rulesVersion`** string or Classic line count without ADR.  
5. Optional CI job **`test:classic-only`**: grep/filter excludes `strategic-*.test.ts` for fast signal.

**Pre-merge grep audit (allowlist in engine `constants.ts` / deprecated exports only):**

| Pattern | Risk |
|---------|------|
| `max(35)` | Replay / PLACE bounds |
| `i < 36` / `length: 36` | Board loops (web overlays, E2E) |
| `getScoringLines(` with **one** argument | Wrong geometry |
| `lineScoreDelta(` with **two** board args only | Wrong scoring |
| `L[2-5]` in UI | Strategic pulse misses L6 |
| `compareLevelCounts` / `winner.ts` fixed level array | Wrong tiebreak |
| `canReachL5` / `achievableL5` | Wrong threat bands on Strategic |
| `for (let v = 1; v <= 5` in `ai-hash` | TT collisions / wrong keys |
| `2.5` center in `centerTiebreak` | Wrong move ordering on 8×8 |

**Golden rule:** Strategic code paths behind `config.boardMode === "strategic"` or separate test files — avoid editing Classic expected vectors in place without duplication.

---

## 10. Phase 0 — Design locks & ADR

- [ ] Sign-off: inventory §5.1, diagonal ids, L3 floor, celebration L5/L6  
- [ ] ADR update: **`2.0.0` = Strategic**; Classic frozen at **1.2.0**  
- [ ] `docs/RULES_STRATEGIC.md` (player-facing)  
- [ ] Fix marketing copy: Classic **9** lines/side (not 11); changelog typo in RULES if needed  
- [ ] Replay schema decision (v1 extend vs v2) documented  
- [ ] ADR-005: document **`getGameConfigForRulesVersion`** (alias of evaluator map)  

---

## 11. Phase A — Config & types

- [ ] `BoardMode`, extended `GameConfig`, `configForBoardMode()`  
- [ ] **`normalizeGameConfig(partial)`** for resume/replay legacy (default `boardMode: "classic"`)  
- [ ] `cellCount`, `boardSize`, `tileValuesFor`, `inventoryFor`, `emptyLevelCounts(config)`  
- [ ] `TileValue` = 1|…|6 with runtime validation per mode  
- [ ] `createInitialState(config)`, `createInitialStateWithFirstPlayer(p, config)`  
- [ ] Export rules version helpers  
- [ ] Widen **`TileValue` / `LineContribution.level`** types per §6.10  

**Verify:** Classic tests green without Strategic tests enabled.

---

## 12. Phase B — Lines & geometry

- [ ] `getScoringLines(perspective, config)`  
- [ ] Diagonal k-offset tables per mode in one module (e.g. `lineGeometry.ts`)  
- [ ] **`boardSize` param** on all index helpers; **remove module-level `DIAG_*`** (§6.7)  
- [ ] `indexToRowCol` / `rowColToIndex` take `boardSize`  
- [ ] Strategic golden tests + Classic flanking tests unchanged  

---

## 13. Phase C — Scoring & winner

- [ ] `analyzeLine(cells, config)`  
- [ ] Thread config through **all** `scoring.ts` exports (see §4.3)  
- [ ] `compareLevelCounts` / `resolveWinner` / `GameResult.decisiveLevel` typing  
- [ ] `analyzePositionForPlayer(state, …)` + **`canReachDecisiveLevelOnLine(state, line, config)`** (replace `canReachL5OnLine`; mode-aware **top level** + floors)  
- [ ] **`classifyLineBand(cells, inventory, lineLength, config)`** — Strategic critical = reachable **L6** (or top tier), not L5  
- [ ] `ai-eval.ts` / **`ai-weights.ts`**: weights for **L6**; `weightedLevels(counts, config)`  
- [ ] `liveScoreLeader(levels, config)`  

**Verify:** duplicate `live-scoring.test.ts` scenarios for Strategic fixture board; extend **`analysis.test.ts`** for 8-cell line / L6 critical ghost-threat.

---

## 14. Phase D — State, replay package

- [ ] Refactor `state.ts` (§5.3)  
- [ ] `@numchess/replay` schema (§8.1)  
- [ ] `packages/engine/__tests__/replay-golden.test.ts` + Strategic mini replay  
- [ ] `createSandboxState` / fixture for Strategic dev  

**Verify:** export/import round-trip Strategic game; Classic replay still parses.

---

## 15. Phase E — Web shell & store

- [ ] `boardMode` in settings + UI toggle  
- [ ] `gameStore.newGame({ config })`  
- [ ] Resume validation (§8.2)  
- [ ] `PlayPage` passes config into store on new game  
- [ ] Resume/settings reconciliation (§8.6)  
- [ ] `persistence`: `parseBoardMode`, `botSearchOptions(difficulty, boardMode)`  

**Verify:** Strategic shell loads 64 cells; Classic unchanged.

---

## 16. Phase F — Feature parity UI

Implement **§1.2 P1–P15** systematically:

- [ ] Board, inventory, keyboard, overlays (dynamic size)  
- [ ] Live score, feed, insights, end screen  
- [ ] Celebrations + audio for Strategic tiers  
- [ ] Replay scrubber + footer export/import  
- [ ] Tutorial off or Strategic-specific copy (like spectator)  

**Verify:** Manual parity checklist (Classic vs Strategic side-by-side).

---

## 17. Phase G — Bot, sims, bench

- [ ] `searchOptionsForDifficulty(level, boardMode)`  
- [ ] Vs bot + spectator on Strategic (E2E)  
- [ ] Bench + sim flags  
- [ ] No stall (`useBotPlayer` timeout still uses options from state’s mode)  

---

## 18. Phase H — Balance, docs, E2E

- [ ] Sims + BALANCE.md  
- [ ] CHANGELOG engine/web/replay  
- [ ] `IMPLEMENTATION_PLAN.md` link  
- [ ] E2E: `strategic-smoke.spec.ts`, `strategic-vs-bot.spec.ts`, `strategic-spectator.spec.ts` (can mirror Classic specs)  
- [ ] a11y spot-check on 8×8  

---

## 19. Test catalog

| Suite | Purpose |
|-------|---------|
| `strategic-lines.test.ts` | Geometry snapshots |
| `strategic-scoring.test.ts` | L3 floor, no L2 counts |
| `strategic-winner.test.ts` | L6 tiebreak |
| `strategic-threat-bands.test.ts` | `classifyLineBand` on 8×8 lines; no false L5-critical |
| `strategic-properties.test.ts` | Full fill 64 plies |
| `classic-regression.test.ts` | Explicit classic config on all legacy tests (audit) |
| `replay-strategic.test.ts` | Zod + replay apply |
| Engine | All existing tests remain Classic |
| E2E | Classic suite + Strategic mirrors |

---

## 20. Definition of done

- [ ] G1–G7 and **P1–P15**  
- [ ] §9 Classic non-regression protocol satisfied  
- [ ] `pnpm --filter @numchess/engine test` + `pnpm build` + `pnpm test:e2e`  
- [ ] `docs/RULES_STRATEGIC.md`  
- [ ] BALANCE.md Strategic row  
- [ ] Plan status → **Implemented**  

---

## 21. Risks & FAQ

| Risk | Mitigation |
|------|------------|
| Silent Classic break via shared API | Config param required; Classic tests; PR protocol §9 |
| Replay breaks | Schema first; max index 63; version map |
| Web reads stale `BOARD_SIZE` | Grep gate in CI: `BOARD_SIZE` only in deprecated re-exports |
| **`lines.ts` module `DIAG_*`** | §6.7 — rebuild per config |
| Stale resume on mode switch | §8.6 cold-start + discard |
| Replay import always warns on 2.0.0 | §8.5 rules map |
| Replay zod out of sync with engine | §8.7 same-PR rule |
| Partial live HUD shows L2 on Strategic | §4.6 `analyzeLine(..., config)` on partials |
| Bot too slow | Strategic presets; bench budget |
| Insight “critical L5” on Strategic | Rename to config.topLevel in threat code |
| Two modes in one bundle | Single engine; config-driven (no duplicate components) |

**FAQ: Same features as Classic?**  
Yes — §1.2 is a ship gate, not optional polish.

**FAQ: Fork web app?**  
No — parameterize existing `/play`.

---

## 22. File checklist (expanded)

**Engine:** `constants.ts`, `types.ts`, `patterns.ts`, `winner.ts`, `lines.ts` (+ optional `lineGeometry.ts`), `scoring.ts`, `state.ts`, `analysis.ts`, `patterns.ts`, all `ai-*.ts`, `bot-move-selector.ts`, `fixtures.ts`, `index.ts`

**Engine tests:** all `__tests__/*` audit + `strategic-*.test.ts`

**Replay:** `packages/replay/src/index.ts`, engine replay golden tests

**Web:** `persistence.ts`, `gameStore.ts`, `PlayPage.tsx`, `Board.tsx`, `InventoryPanel.tsx`, `LiveScorePanel.tsx`, `LevelScoreCard.tsx`, `ScoreFeed.tsx`, `GameModeControls.tsx`, `TurnBanner.tsx`, `EndScreen.tsx`, `PostGameAnalysis.tsx`, `LineLedger.tsx`, `ReplayScrubber.tsx`, `lib/replay.ts`, `lib/lines.ts`, `lib/diagonalGuides.ts`, `lib/spectatorTiming.ts`, `DiagonalGuidesOverlay.tsx`, `LineCelebrationOverlay.tsx`, `lib/lineCelebration.ts`, `hooks/useBoardKeyboard.ts`, `useGameKeyboard.ts`, `useGameAudio.ts`, `useLiveScore.ts`, `lib/tileStyles` / `index.css`, `RulesDialog.tsx`, `SettingsSheet.tsx`

**E2E helpers:** extract `readBoard(page, cellCount)` in `e2e/helpers.ts` (used by replay + future strategic specs)

**Scripts:** `bench-bot-move.ts`, `sim-bot-vs-*.ts`

**E2E:** `strategic-*.spec.ts` + keep Classic specs green

**Docs:** `RULES_STRATEGIC.md`, `RULES.md` cross-link, `BALANCE.md`, `CHANGELOG`, ADR-005 note

---

## 23. PR strategy & estimates

| PR | Content | Estimate |
|----|---------|----------|
| **PR1** | Phases 0–C: config, lines, scoring, analysis/threats, Classic green | 4–6 days |
| **PR2** | Phase D–E: state, **replay package**, web shell + store | 2–4 days |
| **PR3** | Phase F: full UI parity | 3–4 days |
| **PR4** | Phase G–H: bot, sims, E2E, docs | 2–4 days |

**Total:** ~11–18 days (wide range due to parity + mobile polish).

Optional **PR0 spike (1 day):** `configForBoardMode` + **§6.7 geometry refactor** + `getScoringLines(p, config)` + one Strategic **13-line** test — de-risk before full PR1.

---

## 24. Execution checklist

```text
[ ] Phase 0 locks + RULES_STRATEGIC + replay schema decision
[ ] Phase A config/types + rules version map
[ ] Phase B lines (Classic 9 / Strategic 13)
[ ] Phase C scoring API + config threading (grep audit)
[ ] Phase D state + @numchess/replay
[ ] Phase E web shell + resume validation
[ ] Phase F parity P1–P15
[ ] Phase G bot + sims + bench
[ ] Phase H balance + docs + E2E
[ ] §9 Classic regression gate on every PR
```

---

*End of plan v4.*
