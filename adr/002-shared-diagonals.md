# ADR-002: Shared diagonals for both players

**Status:** Proposed  
**Date:** 2026-03-23

## Context

`NUMCHESS_DESIGN_DOCUMENT.md` §4.3 states both main diagonals are evaluated for both players. The prototype assigned ↘ to horizontal scoring only and ↙ to vertical scoring only.

## Decision

Both Player 1 (Rows) and Player 2 (Columns) score **both** diagonals as two of their eight lines.

## Consequences

- Center cells remain strategically dense (row ∩ column ∩ diagonal).
- Draw rate may increase slightly; monitor via `scripts/sim-random.ts`.
- UI line overlays must show both diagonals as shared gold highlights.
