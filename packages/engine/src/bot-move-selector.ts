import type { CompoundMove } from "./ai-moves.js";
import { getLegalCompoundMoves } from "./ai-moves.js";
import {
  collectTacticalMoves,
  selectSearchCandidates,
} from "./ai-candidates.js";
import {
  bestFastMove,
  scoreAllMovesFast,
} from "./ai-fast-score.js";
import { createSearchContext, shouldAbort } from "./ai-search-context.js";
import {
  iterativeDeepeningOnMoves,
  pickEasyNoisyFromFast,
} from "./ai-search-core.js";
import type { SearchOptions } from "./ai-search-types.js";
import { buildThreatMap } from "./ai-threat-map.js";
import type { GameState, PlayerId } from "./types.js";

function emptyCells(board: GameState["board"]): number {
  return board.filter((c) => c === null).length;
}

function adjustedOptions(
  state: GameState,
  options: SearchOptions,
): SearchOptions {
  const empties = emptyCells(state.board);
  const threshold = options.endgameEmptyThreshold ?? 8;
  if (empties > threshold) return options;
  return {
    ...options,
    searchTopK: Math.min(20, (options.searchTopK ?? 12) + 4),
    maxDepth: Math.min(8, (options.maxDepth ?? 5) + 1),
  };
}

export function selectBotMove(
  state: GameState,
  forPlayer: PlayerId,
  options: SearchOptions = {},
): CompoundMove | null {
  if (state.phase.kind === "ended") return null;
  if (state.phase.player !== forPlayer) return null;

  const moves = getLegalCompoundMoves(state);
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0] ?? null;

  const opts = adjustedOptions(state, options);
  const timeMs = opts.timeMs ?? 300;
  const ctx = createSearchContext(timeMs, 0.35);
  const topK = opts.searchTopK ?? 12;

  const tm = buildThreatMap(state, forPlayer);
  const scored = scoreAllMovesFast(state, moves, forPlayer, tm, ctx);

  if (opts.easyNoise) {
    return pickEasyNoisyFromFast(scored, opts.easyTopK ?? 3);
  }

  if (scored.length === 0) return moves[0] ?? null;

  if (shouldAbort(ctx)) {
    return bestFastMove(scored);
  }

  const tactical = collectTacticalMoves(scored);
  let pvMove: CompoundMove | undefined;
  const candidates = selectSearchCandidates(scored, topK, tactical, pvMove);

  const searched = iterativeDeepeningOnMoves(
    state,
    forPlayer,
    candidates,
    ctx,
    opts,
  );

  return searched ?? bestFastMove(scored) ?? moves[0] ?? null;
}
