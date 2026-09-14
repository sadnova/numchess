# Numchess Classic — Rules (rulesVersion 1.1.0)

## Setup

- 6×6 board, 36 empty cells.
- Each player has tiles: **1×3, 2×4, 3×4, 4×4, 5×3** (18 each).

## Turn

1. Choose a tile from your inventory.
2. Place it on any empty cell.
3. Alternate until the board is full.

## Scoring lines

| Player | Lines |
|--------|--------|
| **Player 1 (Rows)** | 6 rows + main diagonal ↘ (7 lines) |
| **Player 2 (Cols)** | 6 columns + main diagonal ↙ (7 lines) |

## Pattern on a line

For **live** scoring during play, use only **filled** cells on that line (partial lines count). At **game end**, each line must be full (6 cells) before it is scored officially—the same R/D rules apply to the filled segment during play and to the full line at end.

For a line segment (partial or full):

- **R** = max count of any single value (cap 5).
- **D** = number of distinct values 1–5 (cap 5).

Each line adds:

- +1 at level **R** if R ≥ 2 (repetition)
- +1 at level **D** if D ≥ 2 (diversity)

Both can apply on the same line (e.g. `1 1 2 3 4 5` → +1 L5 and +1 L2).

## Winner

Compare level **5** counts (rows player vs columns player). If tied, compare 4, then 3, then 2. If still tied → **draw**.

Player 1 uses **row** totals; Player 2 uses **column** totals.

## Changelog

- **1.1.0** — Split diagonals (↘ → Rows, ↙ → Cols); live scoring from partial filled lines.
- **1.0.0** — Shared diagonals for both players; coexistence (R,D) scoring (replaces prototype scorer).
