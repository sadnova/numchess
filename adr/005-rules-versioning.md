# ADR-005: Rules versioning and replay compatibility

**Status:** Proposed  
**Date:** 2026-03-23

## Context

Numchess replays must reproduce outcomes months later. Scoring bugs fixed in place would invalidate shared replay files and erode trust.

## Decision

1. Every replay stores `rulesVersion` (e.g. `"1.0.0"`) separate from npm `@numchess/engine` semver.
2. **Never mutate** behavior for an existing `rulesVersion`. Fixes that change outcomes require a **new** rules version and migration notes in `CHANGELOG.md`.
3. Engine exposes `getRulesEvaluator(rulesVersion)` (or equivalent map) so old replays stay playable.
4. Casual import: warn on unknown future version; reject unknown past version with clear error.
5. Ranked/Arena: strict equality between replay `rulesVersion` and server-supported set.

## Consequences

- Slightly more code (version map) up front.
- Balance changes that affect scoring require explicit product decision + new version id, not a silent patch.
