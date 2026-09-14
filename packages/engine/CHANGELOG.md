# @numchess/engine Changelog

## Unreleased — AI

- Bot eval aligned with live scoring (`scoreLinesFromBoard`), insight bands, contribution-aware move ordering, transposition table, difficulty presets (`searchOptionsForDifficulty`).
- **1.2.0 bot:** line-length-aware analysis for UI; **v3 bot search** (`selectBotMove`: threat map, top-K ID, quiescence, `evaluateStatic` only in tree).

## 1.2.0 — rulesVersion 1.2.0

- Flanking diagonals: two 5-cell parallels per side (`diag-se-ne`, `diag-se-sw`, `diag-sw-nw`, `diag-sw-se`); **9** scoring lines per perspective.
- Official scorer (`evaluateGame`, `isLineComplete`, `scorePerspective`) uses line-aware completeness (5 or 6 cells per line).
- Helpers: `indicesWithRowMinusCol`, `indicesWithRowPlusCol`.

## 1.1.0 — rulesVersion 1.1.0

- Split diagonals: Player 1 (rows) owns ↘ (`diag-se`); Player 2 (columns) owns ↙ (`diag-sw`).
- Live scoring API: `scoreLiveLevels`, `scoreLinesFromBoard`, `lineScoreDelta` (partial lines via `getFilledLineCells`).

## 1.0.0 — rulesVersion 1.0.0

- Classic rules: shared diagonals, (R,D) coexistence scoring, lexicographic winner.
- Initial public API.
