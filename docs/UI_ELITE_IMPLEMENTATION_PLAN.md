# Elite UI — Implementation Plan

**Status:** **Complete** (Phases A–D shipped) — optional: Storybook, `docs/design/` mocks  
**Scope:** `apps/web` visual and UX polish (Home + Play + endgame). No rule or engine changes.  
**Parent:** [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) §9 Phase **3b**, §16–17, §27  
**Excludes:** Phase 7 online UI, full Phase 8 ranked lobby

### Product constraint: light UI only

**Do not ship a dark-mode game shell.** The elite refresh targets a **light, bright board-game aesthetic** (paper/felt table, soft shadows, readable numerals)—not the current dark gradient + glass-on-black look, and **not** a dual light/dark theme toggle in v1.

- **Default and only theme:** light background, dark text, colored accents for P1/P2 and placement.
- **PWA:** `theme-color` and manifest `background_color` align with light surfaces (e.g. warm off-white or soft blue-gray), not `#0f172a`.
- **shadcn:** init with **`default` (light)** style; do not add `dark` class strategy unless explicitly requested later.
- **Optional later:** separate “high contrast” accessibility preset—not a full dark theme.

### Locked decisions (change only via ADR / plan revision)

| ID | Decision | Choice |
|----|----------|--------|
| UI-1 | Theme | **Light only** (no dark shell, no theme toggle v1) |
| UI-2 | Primary CTA hue | **Rows-blue** (`--color-accent-rows` family) — columns-orange stays P2-only |
| UI-3 | Board hero width | `min(92vw, 420px)` desktop cap; scale cells with `min(14vw, 56px)` |
| UI-4 | shadcn | Init once in Phase A; extend `components/ui/` — do not keep parallel custom `Button` long-term |

---

## 0. Reuse from Phase 3a (do not rebuild)

Keep behavior and tests; **restyle and re-layout** only.

| Asset | Location | Notes |
|-------|----------|--------|
| Game store | `store/gameStore.ts` | No changes unless layout needs selectors |
| Click flow | `InventoryPanel.tsx`, `PlayPage.tsx` | Step 1/2 copy + held tile — preserve logic |
| Keyboard | `useBoardKeyboard.ts`, `useGameKeyboard.ts` | Must work after `Board` extract |
| Bot | `useBotPlayer.ts`, `workers/bot.worker.ts` | Untouched |
| Replay | `lib/replay.ts`, `ReplayScrubber.tsx` | Restyle scrubber in Phase B |
| Sounds | `useGameSounds.ts` | Wire to shadcn Switch in settings sheet |
| Tutorial | `usePlayTutorial.ts` | Restyle Driver overlay in Phase D |
| Tile patterns | `index.css` `value-pattern-*`, `lib/tileStyles.ts` | Retune contrast on **light** cells |
| Rules content | `RulesDialog.tsx` | Replace markup with shadcn **Dialog** + light tokens |
| E2E contract | See §14 | **Do not rename** `data-testid`s without updating Playwright |

---

## 1. Goal

Make Numchess feel **intentionally designed**—not a vertical stack of controls on a gradient. Players should instantly see **whose turn**, **what to click next** (inventory → board), and **how they’re doing** (lines/threats/endgame), on both desktop and phone.

**Success looks like:**

- First-time visitor understands “click a number, then the grid” without reading a paragraph.
- Desktop: board is the hero; inventories and insights sit beside it, not above/below a long scroll.
- Visual language is consistent (one accent system, one **light** surface recipe, one motion scale).
- Lighthouse **Accessibility ≥ 90** on `/play`; no regressions to E2E or keyboard flow.

---

## 2. Current state (honest audit)

| Area | Today | Issue |
|------|--------|--------|
| **Layout** | Single column, everything centered | Feels like a form, not a game table |
| **Hierarchy** | Header, modes, bot settings, inventories, copy, board, insights, settings `<details>`, replay buttons | Too many bands of equal weight |
| **Color** | Dark page gradient + light text + mixed accents | **Wrong mode for product**; also no single brand lane |
| **Typography** | Syne/DM Sans loaded; mostly default sizes | Weak display vs UI scale |
| **Board cells** | Generic slate buttons, pulse on place | Readable but not “tile-like” |
| **Inventories** | Small 9×9 buttons + dots | Prototype clarity OK; not premium |
| **Components** | One `Button`, native checkboxes, raw `<details>` | Not shadcn-level consistency |
| **Home** | Title + two buttons | Fine for MVP; not a product landing |
| **End screen** | Table + ledger | Functional; not celebratory |

**Keep:** Two-step click flow, engine-driven legality, threat bands, replay, bot worker, a11y hooks (`aria-live`, grid roles, test IDs).

---

## 3. Target aesthetic

**Keywords:** light table · soft paper surfaces · crisp numerals · calm motion · dual accent (cool rows / warm columns)

**References (mood, not copy-paste):**

- Premium board-game / puzzle apps with **light** boards (wood, felt, or matte white grid)
- IMPLEMENTATION_PLAN §16 — Syne wordmark, DM Sans + tabular nums, OKLCH accents ( tuned for **light** backgrounds )
- Modern strategy UIs — strong center board, peripheral HUD on **neutral light** chrome

**Anti-patterns to avoid:**

- **Dark mode** or near-black page backgrounds (current MVP)
- Rainbow UI (every section a different accent)
- Heavy purple/indigo full-screen gradients
- “Glassmorphism” that only works on dark (`white/10` panels on black)
- Shrinking the board to fit secondary tools above the fold on desktop

---

## 4. Design system foundation

### 4.1 Tokens (`apps/web/src/index.css` `@theme`)

Define and **use everywhere** (no magic hex in components). Values below are **light-theme defaults** (OKLCH):

| Token | Purpose (light) |
|-------|------------------|
| `--color-bg-page` | Page background — warm off-white or cool gray (~`oklch(0.97 0.01 260)`) |
| `--color-surface-1` | Cards/panels — white or near-white |
| `--color-surface-2` | Board well / inset areas — slightly darker than page (~`oklch(0.94 0.02 260)`) |
| `--color-text-primary` | Body copy — high contrast on surfaces (~`oklch(0.25 0.03 260)`) |
| `--color-text-muted` | Secondary labels |
| `--color-border-subtle` | Hairlines on panels (~`oklch(0.88 0.02 260)`) |
| `--color-accent-rows` / `--color-accent-cols` | P1 / P2 chips and panel tints (saturated but readable on white) |
| `--color-accent-action` | Primary CTA — one hue (e.g. rows-blue or teal), not competing with placement |
| `--color-placement` | Step 2 highlight — amber/gold **on light cells** (check WCAG) |
| `--color-threat-*` | Text/icon colors for line insights on white cards |
| `--radius-panel`, `--radius-cell` | 16px panels, 12px cells |
| `--shadow-panel`, `--shadow-cell-raised` | Soft **light-mode** shadows (low opacity black), not glow |

Add **spacing scale** for game shell: `--space-board-gap`, `--size-cell-min` (48px mobile, 56px desktop).

### 4.2 shadcn/ui + Tailwind v4 (IMPLEMENTATION_PLAN Phase 3 recipe)

Execute in order:

1. `pnpm dlx shadcn@latest init` in `apps/web` (Vite + `@tailwindcss/vite` already present).
2. Add primitives: **Button**, **Dialog** (Rules), **Tabs** (modes/settings), **Tooltip**, **Switch**, **Sheet** (mobile settings), **Badge** (turn / threat).
3. `@/` alias + `cn()` — extend existing `lib/utils.ts`.
4. Replace ad-hoc buttons/checkboxes with shadcn variants (`default`, `ghost`, `outline`, `destructive` for reset).

**Rule:** New UI must use tokens + shadcn; no `bg-white/10` on dark or `text-white/70` as default—use semantic text/surface tokens.

### 4.3 Tile & cell visual language (light board)

- **Inventory chip:** light fill + border; active ring; held = filled accent chip (dark numeral on light chip or inverse per contrast test).
- **Board cell:** empty = inset light gray; **placed** = white or cream tile with shadow + value pattern; legal placement = amber outline/fill tint on **light** cell.
- **Placement preview:** pending number inside legal cells—dark text on light amber tint.

---

## 5. Information architecture & layout

### 5.1 Desktop (`lg:` and up) — “game table”

```text
┌─────────────────────────────────────────────────────────────┐
│  Top bar: logo · mode · rules · settings (icon)              │
├──────────────┬──────────────────────────┬───────────────────┤
│  P1 inventory│                          │  P2 inventory     │
│  (sticky)    │      6×6 BOARD (hero)    │  (sticky)         │
│              │      turn banner below   │                   │
│  Line panel  │                          │  Line panel       │
│  (P1 lines)  │                          │  (P2 when active) │
├──────────────┴──────────────────────────┴───────────────────┤
│  Footer strip: undo · replay · review (icon + label)         │
└─────────────────────────────────────────────────────────────┘
```

- **Board max-width** ~420–480px; scale cells with `min()` not full viewport width.
- **Inactive player** panel: collapsed or dimmed sidebar, not full width stack.
- **Match settings** → gear opens **Sheet** or **Dialog**, not always-open `<details>`.

### 5.2 Mobile — “portrait session”

- **Sticky turn banner** under top bar (Player N + step copy).
- **Inventories:** horizontal **chip row** for active player only (or swipeable tabs P1/P2); avoid duplicating full panels.
- **Board** full width with 44px+ cells.
- **Insights:** collapsible bottom sheet (“Lines”) default closed mid-game.
- **Actions:** bottom **toolbar** (undo, new game) with safe-area padding.

### 5.3 Home (`/`)

- Hero: wordmark + one-line hook + **Play** primary.
- Secondary: Rules dialog, optional “How it works” 3-step illustration (click number → click cell → win levels).
- Optional subtle **light** grid motif on home (low-contrast lines on off-white), not a dark animated gradient.

---

## 6. Component work breakdown

| Component | Today | Action |
|-----------|-------|--------|
| `PlayLayout` / `AppShell` | Inline in `PlayPage.tsx` | New grid; move sections into slots |
| `InventoryPanel` | `components/InventoryPanel.tsx` | Chip redesign; may rename to `InventoryChips.tsx` |
| `Board` | Embedded in `PlayPage.tsx` | Extract; props: `placing`, `heldTile`, `highlights` |
| `TurnBanner` | Copy in `PlayPage` + panel headers | Extract; step 1/2 + held badge |
| Line insights | Inline in `PlayPage` | `LineInsightsPanel.tsx` + tokens |
| `LineLedger` / end | `LineLedger.tsx`, `PostGameAnalysis.tsx` | `EndScreen.tsx` composition |
| `GameFooter` | Scattered buttons in `PlayPage` | Group undo / replay / import |
| `SettingsSheet` | `<details>` in `PlayPage` | Sheet: arena, sound, overlays, opening swap |
| `RulesDialog` | Custom dark modal | shadcn Dialog + light tokens |
| `ModeToggle` / bot | Buttons in `PlayPage` | Tabs / segmented control |
| `MatchClock` | `MatchClock.tsx` | Style only; lives in settings or top bar |

**PlayPage** should shrink to composition + store wiring (~150 lines target).

---

## 7. Motion & feedback

| Event | Motion |
|-------|--------|
| Select tile | Chip scale 1.05 → 100ms |
| Enter place phase | Board border fade in; legal cells stagger pulse (optional, reduced-motion off) |
| Place tile | Existing `place` keyframe; add brief inventory dot consume |
| Turn change | Banner crossfade; optional haptic none on web |
| Game end | Confetti **off** by default; scale-in result card |

Use **`motion`** (React) only where CSS isn’t enough; prefer CSS for placement pulse to limit bundle.

---

## 8. Accessibility & color-blind safety

- Never rely on hue alone: keep **patterns** on values 1–5; add **icons or labels** on threat bands (e.g. “!” for critical).
- Focus rings on inventory chips and cells (visible on keyboard path).
- Contrast check placement amber on **light** cells and chips (WCAG AA).
- Tutorial/coach marks: light popover surface, dark text—match tokens; no default Driver.js dark overlay without restyle.

---

## 9. Implementation phases

### Phase A — Foundation (2–3 days)

**Goal:** Light theme + layout skeleton; zero gameplay regressions.

#### A.1 Tokens and global styles

1. Expand `@theme` in `index.css` with §4.1 token names; map Tailwind utilities (e.g. `bg-page`, `text-primary` via `@theme` aliases or CSS variables on `:root`).
2. Replace `body` dark gradient with `background: var(--color-bg-page)` and `color: var(--color-text-primary)`.
3. Grep migration (Phase A–B): `bg-black/`, `bg-slate-9`, `text-white/`, `border-white/`, `bg-indigo` — replace with semantic classes.
4. Update `apps/web/index.html` `theme-color`, `vite.config` PWA manifest `theme_color` / `background_color` to match `--color-bg-page`.

#### A.2 shadcn bootstrap

1. From repo root: `pnpm --filter web exec dlx shadcn@latest init` (style: **default**, base color: **slate** or **neutral**, CSS variables: **yes**).
2. Add: `button`, `dialog`, `switch`, `tabs`, `tooltip`, `sheet`, `badge`.
3. Merge shadcn CSS variables with Numchess tokens (single source: prefer `@theme` overrides over duplicate `:root` blocks).
4. Deprecate hand-rolled `components/ui/Button.tsx` by re-exporting shadcn button or deleting after call-site migration.

#### A.3 Layout extract (structure before polish)

1. Add `components/layout/PlayLayout.tsx` — slots: `topBar`, `leftRail`, `board`, `rightRail`, `footer`.
2. Add `components/game/Board.tsx` — move grid from `PlayPage`; props unchanged for keyboard + test IDs.
3. Add `components/game/TurnBanner.tsx` — step copy from `PlayPage` / inventory header.
4. Wire `PlayPage` to layout; **visual can still look rough** until Phase B.

#### A.4 Verification (required before merge)

```bash
pnpm --filter @numchess/engine test
pnpm --filter web build
pnpm test:e2e
```

Manual: `/play` — select tile → place; vs bot one ply; export replay.

- [x] **Light token sheet** in `@theme`; replace dark `body` gradient in `index.css` with light page + surfaces.
- [x] Update `index.html` `theme-color`, PWA manifest colors, and favicon/splash if needed.
- [x] Radix **Dialog** + **Sheet** + light **Button** (full shadcn CLI optional; `components.json` present).
- [x] `PlayLayout` shell (desktop grid + mobile stack).
- [x] Extract `Board` + `TurnBanner` components (behavior parity).

**Exit:** Layout matches §5 wireframe; E2E still green; page background visibly **light** on `/` and `/play`.

### Phase B — Core game polish (4–6 days)

- [x] Inventory chip redesign + held state (`InventoryPanel.tsx`).
- [x] Board cell states (empty / legal / placed / line highlight) using tokens.
- [x] `AppTopBar` + `GameFooter`; match settings → **Sheet**.
- [x] Line insights card + tokenized threat colors (`LineInsightsPanel.tsx`).
- [x] Mode/bot segmented control; bot controls hidden in local 2P.

**Exit:** `/play` screenshot-ready; click flow unchanged; team sign-off.

**Verify:** `pnpm test:e2e` + keyboard-only game to ply 4 (`docs/ACCESSIBILITY.md`).

### Phase C — Home & endgame (2–3 days)

- [x] Home hero + 3-step explainer.
- [x] EndScreen celebration layout + ledger UX.
- [x] PostGameAnalysis integrated visually.

**Exit:** `/` and ended state match same design system.

### Phase D — Polish & QA (2–3 days)

- [x] Motion pass + `prefers-reduced-motion` (+ settings toggle).
- [x] Tutorial/coach mark restyle (light Driver.js skin).
- [x] Lighthouse a11y gate (`pnpm a11y` / CI).
- [ ] Optional: Storybook for `Cell` states (IMPLEMENTATION_PLAN optional).
- [x] Update `docs/ACCESSIBILITY.md` with layout notes.

**Exit:** Lighthouse a11y ≥ 90 on `/play`; full E2E suite.

**Total estimate:** ~10–15 days (1 FTE designer-dev or designer mock + dev split).

### Phase dependency graph

```text
A (tokens + shadcn + layout extract)
 └─► B (chips, board, bar, sheet, insights)
      └─► C (home, end screen)
           └─► D (motion, tutorial skin, Lighthouse)
```

Do **not** start B until A’s E2E pass. C can overlap B only for `HomePage` if tokens land first.

---

## 10. Acceptance checklist

- [x] Desktop: board visible without scrolling on 1080p with default panels.
- [x] Mobile: one-hand reach to active inventory chips + board.
- [x] Step 1 / Step 2 obvious without reading footer settings.
- [x] P1 vs P2 visually distinct but harmonious on **light** panels (rows cool / cols warm).
- [x] **Light theme only** — no dark page background in `/`, `/play`, or end screen.
- [x] All interactive targets ≥ 44×44px on touch.
- [x] `pnpm test:e2e` passes; no `data-testid` removals without test updates.
- [x] No new engine dependencies; bundle monitored via build (gzip ~138KB JS post-UI).

---

## 11. E2E and test contract

Playwright depends on stable selectors. When refactoring markup, **keep these IDs** (or update `e2e/` in the same PR):

| testid | Purpose |
|--------|---------|
| `app-shell` | Root play layout |
| `home-page`, `play-link` | Home navigation |
| `mode-local2p`, `mode-vsbot` | Mode switch |
| `bot-easy` / `bot-medium` / `bot-hard` | Bot difficulty |
| `seat-p1`, `seat-p2` | Human seat |
| `inventory-p1`, `inventory-p2` | Tutorial + inventory |
| `p1-tile-{1-5}`, `p2-tile-{1-5}` | Tile selection |
| `app-board`, `cell-{0-35}` | Board interaction |
| `export-replay`, `import-replay-input` | Replay flow |

Tutorial hooks: `[data-testid='inventory-p1']`, `[data-testid='app-board']` in `usePlayTutorial.ts`.

---

## 12. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| shadcn + Tailwind v4 init friction | Follow IMPLEMENTATION_PLAN §9 recipe; both `tsconfig` paths for `@/` |
| Bundle >250KB after Radix | Tree-shake; lazy `Sheet`/`Dialog`; run `pnpm --filter web build` + analyze |
| Light contrast fails on amber placement | Fix in Phase D with measured pairs; keep patterns on values |
| Layout extract breaks keyboard focus | Test roving tabindex after `Board` move; E2E keyboard spec |
| Driver.js dark overlay | Phase D: `popoverClass` light skin or replace with in-app coach marks |

---

## 13. Suggested mock order (if designing in Figma first)

1. Play — desktop mid-game (place phase, legal cells lit).  
2. Play — mobile place phase.  
3. End screen — win at L4 with ledger expanded.  
4. Home hero.  
5. Settings sheet + Rules dialog.

---

## 14. File map (expected touch)

```text
apps/web/src/
  index.css                 # tokens, animations
  components/
    layout/PlayLayout.tsx
    layout/AppTopBar.tsx
    game/Board.tsx
    game/TurnBanner.tsx
    game/InventoryChips.tsx
    game/LineInsightsPanel.tsx
    game/EndScreen.tsx
    ui/*                    # shadcn
  pages/HomePage.tsx
  pages/PlayPage.tsx        # compose only
docs/UI_ELITE_IMPLEMENTATION_PLAN.md  # this file
```

---

## 15. Next step

1. Optional: Storybook for board/inventory states.  
2. Optional: reference screenshots in `docs/design/`.  
3. Product: Phase 7 online or Phase 8 Arena when re-scoped.

---

*Last updated: 2026-09-14 — Phases A–D complete; light theme only.*
