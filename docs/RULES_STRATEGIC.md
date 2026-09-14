# Numchess Strategic mode — rules (player-facing)

**Rules version:** `2.0.0`  
**Board:** 8×8 (64 cells) · **Tiles:** 1–6  
**Related:** [RULES.md](./RULES.md) (Classic `1.2.0`)

## Overview

Strategic uses the same turn structure as Classic: pick a tile from your inventory, place it on an empty cell, alternate players until the board is full. Scoring and tiebreaks are **harder** — contributions start at **Level 3**, and the winner compares **L6 down to L3** (no Level 2 band).

## Lines

Each player scores **13 lines**:

| Player | Lines |
|--------|--------|
| **P1 (Rows)** | 8 rows + 5 diagonals ↘ (lengths 8, 7, 7, 6, 6) |
| **P2 (Columns)** | 8 columns + 5 diagonals ↙ (lengths 8, 7, 7, 6, 6) |

Live scoring uses **partial lines** (filled cells only), same as Classic.

## Pattern levels (R / D)

On a **complete** line at game end (or on partial segments for live score):

- **R** = highest count of a single value on the line (capped at **6**).
- **D** = number of distinct values on the line (capped at **6**).

A line contributes:

- **+1 Level R** if **R ≥ 3** (repetition).
- **+1 Level D** if **D ≥ 3** (diversity).

Both can apply on the same line. Levels below 3 do not count.

## Inventories

Each player starts with **32** tiles:

| Value | 1 | 2 | 3 | 4 | 5 | 6 |
|-------|---|---|---|---|---|---|
| Count | 4 | 5 | 6 | 6 | 5 | 6 |

Global totals on the board match these counts (64 placements).

## Winner

Compare **Level 6** row contributions vs column contributions. If tied, compare **L5**, then **L4**, then **L3**. If still tied → **draw**.

## UI

On `/play`, choose **Strategic** in the board mode control (starts a new game). All play features (local 2P, vs bot, bot spectator, replay, resume) work in Strategic when selected.

## Changelog

- **2.0.0** — Initial Strategic mode (8×8, L3–L6, 13 lines/side).
