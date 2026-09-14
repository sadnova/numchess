# Accessibility

Numchess targets **WCAG 2.2 Level AA** on core flows (`/` and `/play`), with a Lighthouse accessibility score **≥ 90** on `/play` (see `IMPLEMENTATION_PLAN.md` §17).

## Keyboard

| Key | Action |
|-----|--------|
| `Tab` / `Shift+Tab` | Move focus; **skip link** appears first to jump to `#main-content` |
| `1`–`5` | Select tile from inventory (select phase, current player) |
| Arrow keys | Move focus among legal placement cells (roving tabindex on board) |
| `Enter` | Place on focused cell |
| `Esc` | Cancel tile selection |
| `Ctrl+Z` / `Cmd+Z` | Undo (casual local games) |

Implementation: `useGameKeyboard`, `useBoardKeyboard`, WAI-ARIA grid pattern on the 6×6 board.

## Screen reader

- **Landmarks:** `main#main-content` on home and play; header/footer regions on play layout.
- **Board:** `role="grid"` with `role="row"` / `role="gridcell"` (proper hierarchy); cell labels include row, column, value or placement hint.
- **Turn flow:** Turn banner uses `aria-live="polite"` for step copy.
- **Inventories:** Tile buttons expose `aria-label` (value + remaining count) and `aria-pressed` when held.
- **Threat insights:** Band labels include text and icons (not color alone); see `lib/threatStyles.ts`.
- **Endgame:** Result heading `id="endgame-heading"`; level table and ledger in expandable sections.

## Visual

- **Light theme** — high-contrast text on surfaces; placement highlight uses ring + fill (not hue alone).
- **Tile values 1–5:** Colored rings plus CSS `value-pattern-*` backgrounds.
- **Threat bands:** Safe / building / threat / critical use text, weight, and badge icons.
- **Focus:** `:focus-visible` outline (accent blue) on buttons, inventory chips, and board cells.

## Motion

- **`prefers-reduced-motion`:** Honored globally via CSS; pulse/place animations disabled.
- **Setting:** Match settings → **Reduce motion** (persists in `numchess-settings`); adds `html.reduce-motion`.
- **Tutorial:** Driver.js coach marks are skipped when reduced motion is active.

## Settings (play)

Open the **gear** icon → sheet includes mute, reduce motion, tutorial, overlays, arena clock, and match options.

## Manual audit checklist

1. Tab from page load through skip link → main → mode controls → inventory → board.
2. Complete one placement with keyboard only (`3` → focus cell → Enter).
3. Run Lighthouse accessibility on `/play` (Chrome DevTools or `npx lighthouse http://localhost:5173/play --only-categories=accessibility`).
4. Zoom 200% — board and inventories remain usable on mobile width.

## E2E

- `e2e/keyboard.spec.ts` — keyboard select + place
- `e2e/a11y.spec.ts` — skip link and main landmark

## CI quality gate

After `pnpm build`, run:

```bash
pnpm a11y:lighthouse
```

Uses production preview on `/play?noTutorial=1` and fails if Lighthouse accessibility **&lt; 90** (currently enforced at **90** via `LH_A11Y_MIN`).
