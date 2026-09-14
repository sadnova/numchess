import { canReachL5OnLine, combinedInventoryCounts } from "./analysis.js";
import { getFilledLineCells, getScoringLines } from "./lines.js";
import type { TileValue } from "./constants.js";
import type { GameState, PlayerId } from "./types.js";
import type { Perspective } from "./types.js";

export interface LineThreatInfo {
  lineId: string;
  indices: number[];
  lineLength: number;
  filled: number;
  empties: number[];
  opponentCanFinishL5: boolean;
}

export interface ThreatMap {
  mover: PlayerId;
  opponent: PlayerId;
  moverLines: LineThreatInfo[];
  opponentLines: LineThreatInfo[];
}

function perspectiveForPlayer(player: PlayerId): Perspective {
  return player === 1 ? "rows" : "columns";
}

function buildLineInfos(
  state: GameState,
  perspective: Perspective,
  inventory: Record<TileValue, number>,
): LineThreatInfo[] {
  const board = state.board;
  const out: LineThreatInfo[] = [];
  for (const line of getScoringLines(perspective, state.config)) {
    const empties = line.indices.filter((i) => board[i] === null);
    const filled = line.indices.length - empties.length;
    const partial = getFilledLineCells(board, line.indices);
    const slotsLeft = line.indices.length - filled;
    let opponentCanFinishL5 = false;
    if (slotsLeft >= 0 && partial.length + slotsLeft === line.indices.length) {
      opponentCanFinishL5 = canReachL5OnLine(
        partial,
        slotsLeft,
        inventory,
        line.indices.length,
        state.config,
      );
    }
    out.push({
      lineId: line.id,
      indices: line.indices,
      lineLength: line.indices.length,
      filled,
      empties,
      opponentCanFinishL5,
    });
  }
  return out;
}

export function buildThreatMap(state: GameState, forPlayer: PlayerId): ThreatMap {
  const opponent: PlayerId = forPlayer === 1 ? 2 : 1;
  const inventory = combinedInventoryCounts(state);
  return {
    mover: forPlayer,
    opponent,
    moverLines: buildLineInfos(
      state,
      perspectiveForPlayer(forPlayer),
      inventory,
    ),
    opponentLines: buildLineInfos(
      state,
      perspectiveForPlayer(opponent),
      inventory,
    ),
  };
}

export function moveBlocksOpponentThreat(
  tm: ThreatMap,
  placeIndex: number,
): boolean {
  for (const line of tm.opponentLines) {
    if (
      line.empties.length === 1 &&
      line.empties[0] === placeIndex &&
      line.opponentCanFinishL5
    ) {
      return true;
    }
  }
  return false;
}
