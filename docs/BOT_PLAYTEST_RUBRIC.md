# Bot playtest rubric (manual)

Score **pass/fail** per scenario when testing **Vs bot / Hard** after v3 ship.

| # | Scenario | Pass if |
|---|----------|---------|
| 1 | Complete obvious row L5 (5/6 + tile) | Bot completes on its turn |
| 2 | Opponent one cell from L5 on a line | Bot blocks or completes first |
| 3 | Flank 4/5 with finishing tile | Bot completes flank |
| 4 | Random-ish midgame | Bot responds within ~1s; no multi-second stall |
| 5 | You set up fork two lines | Bot addresses stronger threat |
| 6 | Near-full board | Bot fills without blundering L5 gift |
| 7 | Switch Easy → Hard | Hard clearly stronger over 3 games |
| 8 | Undo during bot think | No duplicate move / no freeze |
| 9 | New game after loss | Bot moves on its opening turn |
| 10 | You play P2 vs bot | Banner + seat correct; bot moves as P1 |

**Ship gate:** ≥ **8/10** pass.

Automated coverage: `pnpm --filter @numchess/engine test` (`bot-regression`, `bot-v3`).
