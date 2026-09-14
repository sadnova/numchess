# ADR-003: PartyKit for online multiplayer

**Status:** Proposed  
**Date:** 2026-03-23

## Context

Turn-based online play needs authoritative state, low latency, and minimal ops. REST polling with Redis works but feels sluggish for pass-and-play-style turns.

## Decision

Primary online architecture: **PartyKit** (Cloudflare Durable Objects) with WebSocket sync. Server validates moves via `@numchess/engine`. Upstash REST remains documented fallback only.

## Consequences

- Add `apps/party` in Phase 7.
- Deploy web on Cloudflare Pages for ecosystem alignment (optional).
- Clients must not apply opponent moves without server broadcast (no optimistic ranked play until stable).
