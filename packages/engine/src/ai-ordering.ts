import { analyzePositionForPlayer } from "./analysis.js";
import { BOARD_SIZE } from "./constants.js";
import { LEVEL_WEIGHT } from "./ai-weights.js";
import { evaluatePosition } from "./ai-eval.js";
import {
  applyCompoundMove,
  type CompoundMove,
  sameCompoundMove,
} from "./ai-moves.js";
import { getScoringLines } from "./lines.js";
import { lineScoreDelta } from "./scoring.js";
import type { GameState, LineLedgerEntry, PlayerId } from "./types.js";

export function contributionDeltaScore(
  delta: { player1: LineLedgerEntry[]; player2: LineLedgerEntry[] },
  mover: PlayerId,
): number {
  const entries = mover === 1 ? delta.player1 : delta.player2;
  let sum = 0;
  for (const e of entries) {
    for (const c of e.analysis.contributions) {
      sum += LEVEL_WEIGHT[c.level];
    }
  }
  return sum;
}

function perspectiveForPlayer(player: PlayerId): "rows" | "columns" {
  return player === 1 ? "rows" : "columns";
}

export function blocksOpponentCritical(
  state: GameState,
  move: CompoundMove,
): number {
  if (state.phase.kind === "ended") return 0;
  const mover = state.phase.player;
  const opp: PlayerId = mover === 1 ? 2 : 1;
  const perspective = perspectiveForPlayer(opp);
  for (const ins of analyzePositionForPlayer(state, opp)) {
    if (ins.band !== "critical") continue;
    const line = getScoringLines(perspective).find((l) => l.id === ins.lineId);
    if (!line) continue;
    const empties = line.indices.filter((i) => state.board[i] === null);
    if (empties.length === 1 && empties[0] === move.place) return 1;
  }
  return 0;
}

function centerTiebreak(placeIndex: number): number {
  const row = Math.floor(placeIndex / BOARD_SIZE);
  const col = placeIndex % BOARD_SIZE;
  const dr = row - 2.5;
  const dc = col - 2.5;
  return -(dr * dr + dc * dc);
}

export function sortCompoundMoves(
  state: GameState,
  moves: CompoundMove[],
  rootPlayer: PlayerId,
  pvMove?: CompoundMove,
): void {
  const mover =
    state.phase.kind === "ended" ? rootPlayer : state.phase.player;

  const scored = moves.map((move) => {
    const next = applyCompoundMove(state, move);
    let gain = 0;
    let evalScore = -Infinity;
    if (next) {
      const delta = lineScoreDelta(state.board, next.board);
      gain = contributionDeltaScore(delta, mover);
      evalScore = evaluatePosition(next, rootPlayer);
    }
    const block = blocksOpponentCritical(state, move);
    const center = centerTiebreak(move.place);
    const pv = sameCompoundMove(move, pvMove) ? 1 : 0;
    return { move, gain, block, evalScore, center, pv };
  });

  scored.sort((a, b) => {
    if (b.pv !== a.pv) return b.pv - a.pv;
    if (b.gain !== a.gain) return b.gain - a.gain;
    if (b.block !== a.block) return b.block - a.block;
    if (b.evalScore !== a.evalScore) return b.evalScore - a.evalScore;
    return b.center - a.center;
  });

  for (let i = 0; i < moves.length; i++) {
    moves[i] = scored[i]!.move;
  }
}
