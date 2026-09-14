import { DEFAULT_GAME_CONFIG, type GameConfig } from "./constants.js";
import type { TileValue } from "./constants.js";
import type { LineAnalysis, LineContribution } from "./types.js";
import { emptyLevelCounts } from "./config.js";

export function analyzeLine(
  cells: TileValue[],
  config: GameConfig = DEFAULT_GAME_CONFIG,
): LineAnalysis {
  const frequencies: Record<number, number> = {};
  for (const c of cells) {
    frequencies[c] = (frequencies[c] ?? 0) + 1;
  }
  let R = 0;
  for (const count of Object.values(frequencies)) {
    if (count > R) R = count;
  }
  const cap = config.scoring.cap;
  const minR = config.scoring.minR;
  const minD = config.scoring.minD;
  R = Math.min(cap, R);
  const D = Math.min(cap, Object.keys(frequencies).length);

  const contributions: LineContribution[] = [];
  if (R >= minR) {
    contributions.push({
      level: R as LineContribution["level"],
      kind: "repetition",
    });
  }
  if (D >= minD) {
    contributions.push({
      level: D as LineContribution["level"],
      kind: "diversity",
    });
  }

  return { cells: [...cells], R, D, contributions };
}

export { emptyLevelCounts };

export function addContributions(
  counts: import("./types.js").LevelCounts,
  contributions: LineContribution[],
): void {
  for (const c of contributions) {
    counts[c.level] += 1;
  }
}
