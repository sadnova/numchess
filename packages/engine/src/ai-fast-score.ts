import { BOARD_SIZE } from "./constants.js";
import { LEVEL_WEIGHT } from "./ai-weights.js";
import { evaluateStatic } from "./ai-eval.js";
import { contributionDeltaScore } from "./ai-ordering.js";
import type { CompoundMove } from "./ai-moves.js";
import { applyCompoundMove } from "./ai-moves.js";
import type { SearchContext } from "./ai-search-context.js";
import { fastPhaseExpired } from "./ai-search-context.js";
import { moveBlocksOpponentThreat, type ThreatMap } from "./ai-threat-map.js";
import { lineScoreDelta, linesNewlyCompleted } from "./scoring.js";
import type { GameState, PlayerId } from "./types.js";
import { compoundMoveKey } from "./ai-moves.js";

const COMPLETE_BONUS = LEVEL_WEIGHT[5] + LEVEL_WEIGHT[4];
const BLOCK_BONUS = LEVEL_WEIGHT[5];

export interface MoveFastScore {
  move: CompoundMove;
  sortKey: number;
  liveGain: number;
  completesLine: boolean;
  blocksSole: boolean;
  staticEval: number;
}

function centerTiebreak(placeIndex: number): number {
  const row = Math.floor(placeIndex / BOARD_SIZE);
  const col = placeIndex % BOARD_SIZE;
  const dr = row - 2.5;
  const dc = col - 2.5;
  return -(dr * dr + dc * dc) * 0.001;
}

function moverFromState(state: GameState, rootPlayer: PlayerId): PlayerId {
  if (state.phase.kind === "ended") return rootPlayer;
  return state.phase.player;
}

export function scoreMoveFast(
  state: GameState,
  move: CompoundMove,
  rootPlayer: PlayerId,
  tm: ThreatMap,
): MoveFastScore | null {
  const next = applyCompoundMove(state, move);
  if (!next) return null;

  const mover = moverFromState(state, rootPlayer);
  const delta = lineScoreDelta(state.board, next.board);
  const liveGain = contributionDeltaScore(delta, mover);
  const newly = linesNewlyCompleted(state.board, next.board);
  const completesLine =
    (mover === 1 && newly.player1.length > 0) ||
    (mover === 2 && newly.player2.length > 0);
  const blocksSole = moveBlocksOpponentThreat(tm, move.place);

  let sortKey = liveGain + centerTiebreak(move.place);
  if (completesLine) sortKey += COMPLETE_BONUS;
  if (blocksSole) sortKey += BLOCK_BONUS;
  sortKey += evaluateStatic(next, rootPlayer) * 0.0001;

  return {
    move,
    sortKey,
    liveGain,
    completesLine,
    blocksSole,
    staticEval: evaluateStatic(next, rootPlayer),
  };
}

export function scoreAllMovesFast(
  state: GameState,
  moves: CompoundMove[],
  rootPlayer: PlayerId,
  tm: ThreatMap,
  ctx?: SearchContext,
): MoveFastScore[] {
  const scored: MoveFastScore[] = [];
  for (const move of moves) {
    if (ctx && fastPhaseExpired(ctx)) break;
    const s = scoreMoveFast(state, move, rootPlayer, tm);
    if (s) scored.push(s);
  }
  scored.sort((a, b) => {
    if (b.sortKey !== a.sortKey) return b.sortKey - a.sortKey;
    return compoundMoveKey(a.move).localeCompare(compoundMoveKey(b.move));
  });
  return scored;
}

export function bestFastMove(scored: MoveFastScore[]): CompoundMove | null {
  return scored[0]?.move ?? null;
}
