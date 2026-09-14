# Balance notes

Run `pnpm sim:random` after rule changes.

## Sample (500 games, seed 42) — rulesVersion 1.0.0

```json
{
  "games": 500,
  "seed": 42,
  "p1Wins": 251,
  "p2Wins": 243,
  "draws": 6,
  "p1WinRate": 0.502,
  "drawRate": 0.012
}
```

Random vs random: no strong first-player / row bias at this sample size.

## Sample (500 games, seed 42) — rulesVersion 1.2.0

Flanking 5-cell diagonals (9 scoring lines per player).

```json
{
  "games": 500,
  "seed": 42,
  "p1Wins": 259,
  "p2Wins": 235,
  "draws": 6,
  "p1WinRate": 0.518,
  "drawRate": 0.012
}
```

|p1WinRate − 0.5| ≈ 1.8% — within the ±5% fairness bar.

## Bot AI (rulesVersion 1.2.0)

Line-length-aware insight bands (5- and 6-cell lines). **Bot v3 selector** (`searchTopK` + threat map + fast scoring): medium **300ms / K12 / d5**, hard **600ms / K16 / d7** (see [BOT_SEARCH_REVAMP_V3_PLAN.md](./BOT_SEARCH_REVAMP_V3_PLAN.md)).

**Bench (medium, 10 iter):** opening p95 **~366ms**, mid **~375ms** (`pnpm bench:bot`). **Quiescence** depth 2 on medium/hard. Manual checklist: [BOT_PLAYTEST_RUBRIC.md](./BOT_PLAYTEST_RUBRIC.md).

| Command | Purpose |
|---------|---------|
| `pnpm sim:bot` | P2 **medium** search vs P1 random (override `--bot-ms`, `--difficulty`) |
| `pnpm sim:bot-vs-bot` | Medium vs medium sanity |
| `pnpm sim:bot-depth` | Deep (2s/d10) vs shallow (50ms/d2) |

### Sample (20 games, seed 42, medium preset, `--bot-ms 200`)

Gate **≥ 85%** bot win rate vs random — **pass** at this sample.

```json
{
  "rulesVersion": "1.2.0",
  "games": 20,
  "seed": 42,
  "difficulty": "medium",
  "botMs": 200,
  "maxDepth": 4,
  "botSeat": 2,
  "botWins": 20,
  "randomWins": 0,
  "draws": 0,
  "botWinRate": 1
}
```

## Bot AI (rulesVersion 1.1.0) — historical

### Sample (20 games, seed 42, bot-ms 150, P2 search vs P1 random)

```json
{
  "games": 20,
  "seed": 42,
  "botMs": 150,
  "botWins": 17,
  "randomWins": 3,
  "draws": 0,
  "botWinRate": 0.85
}
```

## Web UX (play)

- **Bot vs bot** spectator mode on `/play` (P1/P2 difficulty, pause/play, pace). **L4/L5** line radiate overlay on scoring plies; honors Reduce motion.
