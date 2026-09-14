import { DEFAULT_GAME_CONFIG, type GameConfig } from "./constants.js";
import type { GameResult, LevelCountsPair } from "./types.js";

export function compareLevelCounts(
  rows: LevelCountsPair["rows"],
  columns: LevelCountsPair["columns"],
  config: GameConfig = DEFAULT_GAME_CONFIG,
): { winner: 1 | 2 | null; decisiveLevel: 2 | 3 | 4 | 5 | 6 | null } {
  for (const level of config.scoring.tiebreakLevels) {
    const h = rows[level];
    const v = columns[level];
    if (h > v) return { winner: 1, decisiveLevel: level };
    if (v > h) return { winner: 2, decisiveLevel: level };
  }
  return { winner: null, decisiveLevel: null };
}

export function resolveWinner(
  levels: LevelCountsPair,
  ledger: GameResult extends { ledger: infer L } ? L : never,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): GameResult {
  const { winner, decisiveLevel } = compareLevelCounts(
    levels.rows,
    levels.columns,
    config,
  );
  if (winner === null || decisiveLevel === null) {
    return { outcome: "draw", levels, ledger };
  }
  return {
    outcome: "win",
    winner,
    decisiveLevel,
    levels,
    ledger,
  };
}
