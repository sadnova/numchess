# Numchess

Abstract strategy on a shared 6×6 numerical board. **Player 1** scores **rows** (+ both diagonals); **Player 2** scores **columns** (+ both diagonals).

## Quick start

Requires **Node 22+** and [pnpm](https://pnpm.io/) (or `npx pnpm@9.15.0` if pnpm is not on PATH).

```bash
pnpm install
pnpm build
pnpm test
pnpm dev
```

Open http://localhost:5173 — choose **Play Classic**, or go to `/play` directly. Sandbox: `/play?sandbox=1`.

## Workspace

| Package | Description |
|---------|-------------|
| `@numchess/engine` | Pure rules, scoring, moves |
| `@numchess/replay` | Replay JSON (Zod) |
| `@numchess/web` | React + Vite app |

## Scripts

- `pnpm dev` — web app
- `pnpm test` — engine tests
- `pnpm test:e2e` — Playwright (smoke, replay, keyboard, a11y landmarks)
- `pnpm a11y` — production build + Lighthouse accessibility gate on `/play` (≥90)
- `pnpm sim:random` — balance simulation (500 games, seed 42)
- `pnpm sim:bot` — bot (P2) vs random (P1), 50 games

## Docs

- [Implementation plan](./IMPLEMENTATION_PLAN.md)
- [Design document](./NUMCHESS_DESIGN_DOCUMENT.md)
- [Rules](./docs/RULES.md) (player-facing)
- [Accessibility](./docs/ACCESSIBILITY.md)
- [Arena (local)](./docs/ARENA.md)
- [Elite UI plan](./docs/UI_ELITE_IMPLEMENTATION_PLAN.md)
- [Live scoring & audio plan](./docs/LIVE_SCORING_AND_AUDIO_PLAN.md)
- [ADRs](./adr/)

Prototype archived at `legacy/index.prototype.html`.

## Deploy (Vercel)

1. Import [github.com/sadnova/numchess](https://github.com/sadnova/numchess) on [Vercel](https://vercel.com/new).
2. Leave **Root Directory** empty (repo root). `vercel.json` sets install/build/output.
3. **Node.js 22** (matches `.nvmrc` and CI).

Production build: `pnpm turbo run build --filter=@numchess/web` → `apps/web/dist`.

Client routes (`/`, `/play`) use SPA rewrites in `vercel.json`.
