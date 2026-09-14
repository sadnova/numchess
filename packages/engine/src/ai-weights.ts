import type { LevelCounts } from "./types.js";

export const LEVEL_WEIGHT: Record<2 | 3 | 4 | 5 | 6, number> = {
  2: 10,
  3: 100,
  4: 1000,
  5: 10_000,
  6: 100_000,
};

export const WIN_SCORE = 1_000_000;

export const AI_EVAL_WEIGHTS = {
  lexPerLevel: 400,
  own: { critical: 120, threat: 40, building: 12, safe: 0 },
  opp: { critical: 150, threat: 50, building: 0, safe: 0 },
} as const;

export function weightedLevels(counts: LevelCounts): number {
  return (
    counts[2] * LEVEL_WEIGHT[2] +
    counts[3] * LEVEL_WEIGHT[3] +
    counts[4] * LEVEL_WEIGHT[4] +
    counts[5] * LEVEL_WEIGHT[5] +
    counts[6] * LEVEL_WEIGHT[6]
  );
}
