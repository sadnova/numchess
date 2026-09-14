import { LEVEL_WEIGHT } from "./ai-weights.js";
import { evaluateStatic } from "./ai-eval.js";
import { hashGameState } from "./ai-hash.js";
import {
  applyCompoundMove,
  type CompoundMove,
  getLegalCompoundMoves,
  sameCompoundMove,
} from "./ai-moves.js";
import { buildThreatMap } from "./ai-threat-map.js";
import {
  scoreAllMovesFast,
  scoreMoveFast,
} from "./ai-fast-score.js";
import type { SearchContext } from "./ai-search-context.js";
import { shouldAbort } from "./ai-search-context.js";
import type { SearchOptions } from "./ai-search-types.js";
import type { GameState, PlayerId } from "./types.js";

type TtEntry = {
  depth: number;
  score: number;
  bestMove?: CompoundMove;
};

const TT_SIZE = 1 << 18;
const QUIESCENCE_GAIN_MIN = LEVEL_WEIGHT[4] / 2;

function ttIndex(key: bigint): number {
  return Number(key & BigInt(TT_SIZE - 1));
}

function orderMovesByFast(
  state: GameState,
  moves: CompoundMove[],
  rootPlayer: PlayerId,
  childTopK: number,
  pvMove?: CompoundMove,
): CompoundMove[] {
  if (moves.length <= childTopK) return moves;
  const tm = buildThreatMap(state, rootPlayer);
  const scored = moves
    .map((m) => scoreMoveFast(state, m, rootPlayer, tm))
    .filter((s): s is NonNullable<typeof s> => s !== null);
  scored.sort((a, b) => b.sortKey - a.sortKey);
  let ordered = scored.slice(0, childTopK).map((s) => s.move);
  if (pvMove) {
    ordered = [
      pvMove,
      ...ordered.filter((m) => !sameCompoundMove(m, pvMove)),
    ].slice(0, childTopK);
  }
  return ordered;
}

function tacticalMovesForQuiescence(
  state: GameState,
  rootPlayer: PlayerId,
  childTopK: number,
): CompoundMove[] {
  const tm = buildThreatMap(state, rootPlayer);
  const all = getLegalCompoundMoves(state);
  const scored = all
    .map((m) => scoreMoveFast(state, m, rootPlayer, tm))
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .filter(
      (s) =>
        s.completesLine ||
        s.blocksSole ||
        s.liveGain >= QUIESCENCE_GAIN_MIN,
    );
  scored.sort((a, b) => b.sortKey - a.sortKey);
  return scored.slice(0, childTopK).map((s) => s.move);
}

function quiescence(
  state: GameState,
  alpha: number,
  beta: number,
  rootPlayer: PlayerId,
  ctx: SearchContext,
  qdepth: number,
  opts: SearchOptions,
): number {
  if (shouldAbort(ctx) || qdepth <= 0) {
    return evaluateStatic(state, rootPlayer);
  }

  let best = evaluateStatic(state, rootPlayer);
  alpha = Math.max(alpha, best);
  if (alpha >= beta) return best;

  const childTopK = opts.childTopK ?? 8;
  const moves = tacticalMovesForQuiescence(state, rootPlayer, childTopK);

  for (const move of moves) {
    if (shouldAbort(ctx)) break;
    const next = applyCompoundMove(state, move);
    if (!next) continue;
    const score = -quiescence(
      next,
      -beta,
      -alpha,
      rootPlayer,
      ctx,
      qdepth - 1,
      opts,
    );
    if (score > best) best = score;
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }

  return best;
}

function negamax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  rootPlayer: PlayerId,
  ctx: SearchContext,
  tt: TtEntry[],
  useTt: boolean,
  opts: SearchOptions,
  pvMove?: CompoundMove,
): number {
  if (shouldAbort(ctx)) {
    return evaluateStatic(state, rootPlayer);
  }

  let ttMove: CompoundMove | undefined = pvMove;

  if (useTt && depth > 0) {
    const key = hashGameState(state);
    const slot = tt[ttIndex(key)];
    if (slot && slot.depth >= depth) {
      return slot.score;
    }
    if (slot?.bestMove) ttMove = slot.bestMove;
  }

  if (state.phase.kind === "ended") {
    return evaluateStatic(state, rootPlayer);
  }

  if (depth === 0) {
    const qd = opts.quiescenceDepth ?? 0;
    if (qd > 0) {
      return quiescence(state, alpha, beta, rootPlayer, ctx, qd, opts);
    }
    return evaluateStatic(state, rootPlayer);
  }

  let moves = getLegalCompoundMoves(state);
  if (moves.length === 0) return evaluateStatic(state, rootPlayer);

  const childTopK = opts.childTopK ?? 8;
  moves = orderMovesByFast(state, moves, rootPlayer, childTopK, ttMove);

  let best = -Infinity;
  let bestMove: CompoundMove | undefined;

  for (const move of moves) {
    if (shouldAbort(ctx)) break;
    const next = applyCompoundMove(state, move);
    if (!next) continue;
    const score = -negamax(
      next,
      depth - 1,
      -beta,
      -alpha,
      rootPlayer,
      ctx,
      tt,
      useTt,
      opts,
    );
    if (score > best) {
      best = score;
      bestMove = move;
    }
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }

  if (useTt && depth > 0 && bestMove && best > -Infinity) {
    const key = hashGameState(state);
    tt[ttIndex(key)] = { depth, score: best, bestMove };
  }

  return best;
}

export function iterativeDeepeningOnMoves(
  state: GameState,
  forPlayer: PlayerId,
  candidates: CompoundMove[],
  ctx: SearchContext,
  options: SearchOptions,
): CompoundMove | null {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0] ?? null;

  const maxDepth = options.maxDepth ?? 5;
  const useTt = options.useTranspositionTable !== false;
  const tt: TtEntry[] = new Array(TT_SIZE);

  let bestMove: CompoundMove | null = candidates[0] ?? null;
  let pvMove: CompoundMove | undefined = bestMove ?? undefined;

  for (let depth = 1; depth <= maxDepth; depth++) {
    if (shouldAbort(ctx)) break;

    let layerBest: CompoundMove | null = null;
    let layerScore = -Infinity;

    const ordered =
      pvMove !== undefined
        ? [
            pvMove,
            ...candidates.filter((m) => !sameCompoundMove(m, pvMove)),
          ]
        : candidates;

    for (const move of ordered) {
      if (shouldAbort(ctx)) break;
      const next = applyCompoundMove(state, move);
      if (!next) continue;
      const score = -negamax(
        next,
        depth - 1,
        -Infinity,
        Infinity,
        forPlayer,
        ctx,
        tt,
        useTt,
        options,
      );
      if (score > layerScore) {
        layerScore = score;
        layerBest = move;
      }
    }

    if (layerBest) {
      bestMove = layerBest;
      pvMove = layerBest;
    }
  }

  return bestMove;
}

export function pickEasyNoisyFromFast(
  scored: ReturnType<typeof scoreAllMovesFast>,
  topK: number,
): CompoundMove | null {
  const k = Math.min(topK, scored.length);
  if (k === 0) return null;
  const top = scored.slice(0, k);
  return top[Math.floor(Math.random() * top.length)]?.move ?? null;
}
