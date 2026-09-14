# @numchess/engine Changelog

## Unreleased — AI

- Bot eval aligned with live scoring (`scoreLinesFromBoard`), insight bands, contribution-aware move ordering, transposition table, difficulty presets (`searchOptionsForDifficulty`).

## 1.1.0 — rulesVersion 1.1.0

- Split diagonals: Player 1 (rows) owns ↘ (`diag-se`); Player 2 (columns) owns ↙ (`diag-sw`).
- Live scoring API: `scoreLiveLevels`, `scoreLinesFromBoard`, `lineScoreDelta` (partial lines via `getFilledLineCells`).

## 1.0.0 — rulesVersion 1.0.0

- Classic rules: shared diagonals, (R,D) coexistence scoring, lexicographic winner.
- Initial public API.
