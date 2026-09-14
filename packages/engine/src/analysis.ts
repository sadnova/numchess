/**
 * Partial-line UX analysis (not used for scoring).
 * Threat bands:
 * - building: partial R/D approaching a scoring threshold
 * - threat: strong partial pattern on the line
 * - critical: a full-line L5 repetition or L5 diversity is still reachable
 *   using tiles remaining in **both** inventories combined; otherwise a line
 *   that looks decisive but cannot be finished is downgraded (ghost threat)
 */
import { TILE_VALUES, type TileValue } from "./constants.js";
import { getLineCells, getScoringLines } from "./lines.js";
import { analyzeLine } from "./patterns.js";
import type { GameState, LineAnalysis, Perspective, PlayerId } from "./types.js";

export type ThreatBand = "safe" | "building" | "threat" | "critical";

export interface LineInsight {
  lineId: string;
  label: string;
  filled: number;
  lineLength: number;
  analysis: LineAnalysis;
  band: ThreatBand;
}

function perspectiveForPlayer(player: PlayerId): Perspective {
  return player === 1 ? "rows" : "columns";
}

export function analyzePartialLine(cells: TileValue[]): LineAnalysis {
  if (cells.length === 0) {
    return { cells: [], R: 0, D: 0, contributions: [] };
  }
  return analyzeLine(cells);
}

export function combinedInventoryCounts(
  state: GameState,
): Record<TileValue, number> {
  const out: Record<TileValue, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const inv of state.inventories) {
    for (const v of TILE_VALUES) {
      out[v] += inv.counts[v];
    }
  }
  return out;
}

function cloneCounts(
  counts: Record<TileValue, number>,
): Record<TileValue, number> {
  return { ...counts };
}

/** Whether `slotsLeft` placements from `available` can complete a line with R≥5 or D≥5. */
export function canReachL5OnLine(
  partial: TileValue[],
  slotsLeft: number,
  available: Record<TileValue, number>,
  lineLength = 6,
): boolean {
  if (slotsLeft < 0 || partial.length + slotsLeft !== lineLength) return false;
  if (slotsLeft === 0) {
    if (partial.length !== lineLength) return false;
    const a = analyzeLine(partial);
    return a.R >= 5 || a.D >= 5;
  }
  for (const v of TILE_VALUES) {
    if (available[v] <= 0) continue;
    const next = cloneCounts(available);
    next[v] -= 1;
    if (canReachL5OnLine([...partial, v], slotsLeft - 1, next, lineLength)) {
      return true;
    }
  }
  return false;
}

export function classifyLineBand(
  cells: TileValue[],
  inventory: Record<TileValue, number>,
  lineLength = 6,
): ThreatBand {
  const filled = cells.length;
  if (filled === 0) return "safe";

  const analysis = analyzePartialLine(cells);
  const slotsLeft = lineLength - filled;
  const achievableL5 = canReachL5OnLine(cells, slotsLeft, inventory, lineLength);
  const onBoardDecisive =
    filled >= 5 && (analysis.R >= 5 || analysis.D >= 5);

  if (onBoardDecisive) {
    return achievableL5 ? "critical" : "threat";
  }
  if (achievableL5 && filled >= 4) return "critical";
  if (analysis.R >= 4 || analysis.D >= 4) return "threat";
  if (analysis.R >= 2 || analysis.D >= 3) return "building";
  return "safe";
}

const BAND_RANK: Record<ThreatBand, number> = {
  safe: 0,
  building: 1,
  threat: 2,
  critical: 3,
};

function maxBand(a: ThreatBand, b: ThreatBand): ThreatBand {
  return BAND_RANK[b] > BAND_RANK[a] ? b : a;
}

/** Opponent scoring lines that share a cell with `lineIndices` at threat+ pressure. */
function opponentPressureBand(
  state: GameState,
  lineIndices: number[],
  forPlayer: PlayerId,
): ThreatBand {
  const opponent: PlayerId = forPlayer === 1 ? 2 : 1;
  const cellSet = new Set(lineIndices);
  const oppInsights = analyzePositionForPlayerRaw(state, opponent);
  let pressure: ThreatBand = "safe";
  for (const insight of oppInsights) {
    const oppCells = getScoringLines(
      opponent === 1 ? "rows" : "columns",
    ).find((l) => l.id === insight.lineId)?.indices;
    if (!oppCells?.some((i) => cellSet.has(i))) continue;
    if (insight.band === "critical" || insight.band === "threat") {
      pressure = maxBand(pressure, "threat");
    } else if (insight.band === "building") {
      pressure = maxBand(pressure, "building");
    }
  }
  return pressure;
}

function analyzePositionForPlayerRaw(
  state: GameState,
  player: PlayerId,
): LineInsight[] {
  const perspective = perspectiveForPlayer(player);
  const inventory = combinedInventoryCounts(state);
  const insights: LineInsight[] = [];
  for (const line of getScoringLines(perspective)) {
    const cells = getLineCells(state.board, line.indices);
    const analysis = analyzePartialLine(cells);
    insights.push({
      lineId: line.id,
      label: line.label,
      filled: cells.length,
      lineLength: line.indices.length,
      analysis,
      band: classifyLineBand(cells, inventory, line.indices.length),
    });
  }
  return insights;
}

export function analyzePositionForPlayer(
  state: GameState,
  player: PlayerId,
): LineInsight[] {
  const base = analyzePositionForPlayerRaw(state, player);
  return base.map((insight) => {
    const line = getScoringLines(perspectiveForPlayer(player)).find(
      (l) => l.id === insight.lineId,
    );
    if (!line) return insight;
    const pressure = opponentPressureBand(state, line.indices, player);
    return {
      ...insight,
      band: maxBand(insight.band, pressure),
    };
  });
}

export function cancelSelection(
  state: GameState,
): import("./types.js").Result<GameState, import("./types.js").IllegalMoveReason> {
  if (state.phase.kind !== "place") {
    return { ok: false, error: "WRONG_PHASE" };
  }
  const history = state.history.slice(0, -1);
  return {
    ok: true,
    value: {
      ...state,
      phase: { kind: "select", player: state.phase.player },
      history,
    },
  };
}
