# ADR-004: Engine development — Vite alias to source

**Status:** Proposed  
**Date:** 2026-03-23

## Context

The monorepo consumes `@numchess/engine` from `apps/web` and eventually from `apps/party` and a Web Worker. Options:

1. **unbuild `--stub`** — fast but ESM stub + Vite has compatibility issues ([unbuild #35](https://github.com/unjs/unbuild/issues/35)).
2. **tsup --watch** — reliable rebuild loop; extra process in dev.
3. **Vite resolve alias** to `packages/engine/src` — HMR on engine source during web dev; CI still runs `turbo run build` on engine to produce `dist/`.

## Decision

Use **Vite alias → engine `src`** for local web development. Use **tsup** (or unbuild full build, not stub) to emit `dist/` for CI, PartyKit, and published `exports` map.

## Consequences

- `apps/web/vite.config.ts` must define alias; document in README.
- Engine package tests always run against source via Vitest (not dist).
- PartyKit worker imports built engine or bundles from source via its own build step — verify in Phase 7.
