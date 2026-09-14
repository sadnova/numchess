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

## Bot AI (rulesVersion 1.1.0)

Eval uses live `scoreLinesFromBoard`, insight bands, contribution-aware ordering, TT search.

| Command | Purpose |
|---------|---------|
| `pnpm sim:bot` | P2 search vs P1 random (`--bot-ms` time budget) |
| `pnpm sim:bot-vs-bot` | Medium vs medium sanity |
| `pnpm sim:bot-depth` | Deep (2s/d10) vs shallow (50ms/d2) |

Re-run after AI changes and append results (games, seed, win rates).

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
