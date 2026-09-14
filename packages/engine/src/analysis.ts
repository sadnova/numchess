/**
 * Partial-line UX analysis (not used for scoring).
 */
import { DEFAULT_GAME_CONFIG, type GameConfig } from "./constants.js";
import { tileValuesFor } from "./config.js";
import type { TileValue } from "./constants.js";
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

export function analyzePartialLine(
  cells: TileValue[],
  config: GameConfig = DEFAULT_GAME_CONFIG,
): LineAnalysis {
  if (cells.length === 0) {
    return { cells: [], R: 0, D: 0, contributions: [] };
  }
  return analyzeLine(cells, config);
}

export function combinedInventoryCounts(
  state: GameState,
): Record<TileValue, number> {
  const tiles = tileValuesFor(state.config);
  const out = Object.fromEntries(tiles.map((v) => [v, 0])) as Record<
    TileValue,
    number
  >;
  for (const inv of state.inventories) {
    for (const v of tiles) {
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

function topScoringLevel(config: GameConfig): number {
  return config.scoring.cap;
}

/** Whether a full line can still reach top-tier R or D from `partial`. */
export function canReachL5OnLine(
  partial: TileValue[],
  slotsLeft: number,
  available: Record<TileValue, number>,
  lineLength = 6,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): boolean {
  const top = topScoringLevel(config);
  const tiles = tileValuesFor(config);
  if (slotsLeft < 0 || partial.length + slotsLeft !== lineLength) return false;
  if (slotsLeft === 0) {
    if (partial.length !== lineLength) return false;
    const a = analyzeLine(partial, config);
    return a.R >= top || a.D >= top;
  }
  for (const v of tiles) {
    if (available[v] <= 0) continue;
    const next = cloneCounts(available);
    next[v] -= 1;
    if (
      canReachL5OnLine([...partial, v], slotsLeft - 1, next, lineLength, config)
    ) {
      return true;
    }
  }
  return false;
}

export function classifyLineBand(
  cells: TileValue[],
  inventory: Record<TileValue, number>,
  lineLength = 6,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): ThreatBand {
  const filled = cells.length;
  if (filled === 0) return "safe";

  const analysis = analyzePartialLine(cells, config);
  const slotsLeft = lineLength - filled;
  const top = topScoringLevel(config);
  const achievableTop = canReachL5OnLine(
    cells,
    slotsLeft,
    inventory,
    lineLength,
    config,
  );
  const onBoardDecisive =
    filled >= lineLength - 1 && (analysis.R >= top || analysis.D >= top);

  if (onBoardDecisive) {
    return achievableTop ? "critical" : "threat";
  }
  if (achievableTop && filled >= lineLength - 2) return "critical";
  if (analysis.R >= top - 1 || analysis.D >= top - 1) return "threat";
  const minR = config.scoring.minR;
  const minD = config.scoring.minD;
  if (analysis.R >= minR || analysis.D >= minD + 1) return "building";
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
      state.config,
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
  const config = state.config;
  const perspective = perspectiveForPlayer(player);
  const inventory = combinedInventoryCounts(state);
  const insights: LineInsight[] = [];
  for (const line of getScoringLines(perspective, config)) {
    const cells = getLineCells(state.board, line.indices);
    const analysis = analyzePartialLine(cells, config);
    insights.push({
      lineId: line.id,
      label: line.label,
      filled: cells.length,
      lineLength: line.indices.length,
      analysis,
      band: classifyLineBand(cells, inventory, line.indices.length, config),
    });
  }
  return insights;
}

export function analyzePositionForPlayer(
  state: GameState,
  player: PlayerId,
): LineInsight[] {
  const config = state.config;
  const base = analyzePositionForPlayerRaw(state, player);
  return base.map((insight) => {
    const line = getScoringLines(perspectiveForPlayer(player), config).find(
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
