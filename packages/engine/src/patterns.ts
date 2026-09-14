import type { TileValue } from "./constants.js";
import type { LineAnalysis, LineContribution } from "./types.js";

export function analyzeLine(cells: TileValue[]): LineAnalysis {
  const frequencies: Record<number, number> = {};
  for (const c of cells) {
    frequencies[c] = (frequencies[c] ?? 0) + 1;
  }
  let R = 0;
  for (const count of Object.values(frequencies)) {
    if (count > R) R = count;
  }
  R = Math.min(5, R);
  const D = Math.min(5, Object.keys(frequencies).length);

  const contributions: LineContribution[] = [];
  if (R >= 2) {
    contributions.push({
      level: R as 2 | 3 | 4 | 5,
      kind: "repetition",
    });
  }
  if (D >= 2) {
    contributions.push({
      level: D as 2 | 3 | 4 | 5,
      kind: "diversity",
    });
  }

  return { cells: [...cells], R, D, contributions };
}

export function emptyLevelCounts(): Record<2 | 3 | 4 | 5, number> {
  return { 2: 0, 3: 0, 4: 0, 5: 0 };
}

export function addContributions(
  counts: Record<2 | 3 | 4 | 5, number>,
  contributions: LineContribution[],
): void {
  for (const c of contributions) {
    counts[c.level] += 1;
  }
}
