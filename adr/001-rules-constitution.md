# ADR-001: Rules constitution

**Status:** Proposed  
**Date:** 2026-03-23

## Context

Numchess Classic needs a single authoritative scoring model before UI work. The prototype mixed frequency aggregation with a broken diversity path (`pop()` on key `9`).

## Decision

Adopt the (R, D) coexistence model per `IMPLEMENTATION_PLAN.md` §2:

- 8 scoring lines per player (6 primary + 2 shared diagonals).
- Per full line: +1 at Level R and +1 at Level D when R ≥ 2 and D ≥ 2 respectively, capped at 5.
- Lexicographic winner Levels 5→2; full tie = draw.

## Consequences

- Engine tests and golden fixtures are the source of truth.
- Replay files include `rulesVersion` tied to engine semver.
