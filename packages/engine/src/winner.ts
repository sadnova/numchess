import type { GameResult, LevelCountsPair } from "./types.js";

export function compareLevelCounts(
  rows: LevelCountsPair["rows"],
  columns: LevelCountsPair["columns"],
): { winner: 1 | 2 | null; decisiveLevel: 2 | 3 | 4 | 5 | null } {
  const levels: (2 | 3 | 4 | 5)[] = [5, 4, 3, 2];
  for (const level of levels) {
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
): GameResult {
  const { winner, decisiveLevel } = compareLevelCounts(
    levels.rows,
    levels.columns,
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
