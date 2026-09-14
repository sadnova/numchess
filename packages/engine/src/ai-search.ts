import { evaluatePosition } from "./ai-eval.js";
import { hashGameState } from "./ai-hash.js";
import {
  applyCompoundMove,
  type CompoundMove,
  getLegalCompoundMoves,
} from "./ai-moves.js";
import { sortCompoundMoves } from "./ai-ordering.js";
import type { GameState, PlayerId } from "./types.js";

export interface SearchOptions {
  timeMs?: number;
  maxDepth?: number;
  /** Easy: randomize among top moves by eval */
  easyNoise?: boolean;
  easyTopK?: number;
  useTranspositionTable?: boolean;
}

type TtFlag = "exact" | "lower" | "upper";

interface TtEntry {
  depth: number;
  score: number;
  flag: TtFlag;
  bestMove?: CompoundMove;
}

const TT_SIZE = 1 << 18;

function ttIndex(key: bigint): number {
  return Number(key & BigInt(TT_SIZE - 1));
}

function negamax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  rootPlayer: PlayerId,
  deadline: number,
  tt: TtEntry[],
  useTt: boolean,
  pvMove?: CompoundMove,
): number {
  if (Date.now() >= deadline) {
    return evaluatePosition(state, rootPlayer);
  }

  let ttMove: CompoundMove | undefined = pvMove;

  if (useTt && depth > 0) {
    const key = hashGameState(state);
    const slot = tt[ttIndex(key)];
    if (slot && slot.depth >= depth && slot.flag === "exact") {
      return slot.score;
    }
    if (slot?.bestMove) ttMove = slot.bestMove;
  }

  if (state.phase.kind === "ended" || depth === 0) {
    return evaluatePosition(state, rootPlayer);
  }

  const moves = getLegalCompoundMoves(state);
  if (moves.length === 0) return evaluatePosition(state, rootPlayer);

  sortCompoundMoves(state, moves, rootPlayer, ttMove);

  let best = -Infinity;
  let bestMove: CompoundMove | undefined;

  for (const move of moves) {
    const next = applyCompoundMove(state, move);
    if (!next) continue;
    const score = -negamax(
      next,
      depth - 1,
      -beta,
      -alpha,
      rootPlayer,
      deadline,
      tt,
      useTt,
    );
    if (score > best) {
      best = score;
      bestMove = move;
    }
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }

  if (useTt && depth > 0) {
    const key = hashGameState(state);
    const idx = ttIndex(key);
    const prev = tt[idx];
    if (!prev || depth >= prev.depth) {
      tt[idx] = { depth, score: best, flag: "exact", bestMove };
    }
  }

  return best;
}

function pickEasyNoisyMove(
  state: GameState,
  moves: CompoundMove[],
  forPlayer: PlayerId,
  topK: number,
): CompoundMove | null {
  sortCompoundMoves(state, moves, forPlayer);
  const k = Math.min(topK, moves.length);
  const top = moves.slice(0, k);
  return top[Math.floor(Math.random() * top.length)] ?? null;
}

export function searchBestMove(
  state: GameState,
  forPlayer: PlayerId,
  options: SearchOptions = {},
): CompoundMove | null {
  if (state.phase.kind === "ended") return null;
  if (state.phase.player !== forPlayer) return null;

  const timeMs = options.timeMs ?? 800;
  const maxDepth = options.maxDepth ?? 7;
  const useTt = options.useTranspositionTable ?? true;
  const deadline = Date.now() + timeMs;
  const moves = getLegalCompoundMoves(state);
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0] ?? null;

  if (options.easyNoise) {
    return pickEasyNoisyMove(
      state,
      moves,
      forPlayer,
      options.easyTopK ?? 3,
    );
  }

  const tt: TtEntry[] = new Array(TT_SIZE);
  let bestMove: CompoundMove | null = null;
  let pvMove: CompoundMove | undefined;

  for (let depth = 1; depth <= maxDepth; depth++) {
    sortCompoundMoves(state, moves, forPlayer, pvMove);
    let layerBest: CompoundMove | null = null;
    let layerScore = -Infinity;

    for (const move of moves) {
      const next = applyCompoundMove(state, move);
      if (!next) continue;
      const score = -negamax(
        next,
        depth - 1,
        -Infinity,
        Infinity,
        forPlayer,
        deadline,
        tt,
        useTt,
      );
      if (score > layerScore) {
        layerScore = score;
        layerBest = move;
      }
      if (Date.now() >= deadline) break;
    }

    if (layerBest) {
      bestMove = layerBest;
      pvMove = layerBest;
    }
    if (Date.now() >= deadline) break;
  }

  return bestMove ?? moves[0] ?? null;
}

/** Search first; always returns a legal compound move when any exist. */
export function chooseBotMove(
  state: GameState,
  forPlayer: PlayerId,
  options: SearchOptions = {},
): CompoundMove | null {
  if (state.phase.kind === "ended") return null;
  if (state.phase.player !== forPlayer) return null;

  const moves = getLegalCompoundMoves(state);
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0] ?? null;

  try {
    const picked = searchBestMove(state, forPlayer, options);
    if (picked) return picked;
  } catch {
    // use first legal move below
  }

  return moves[0] ?? null;
}

export function pickSearchMove(
  state: GameState,
  player: PlayerId,
  timeMs: number,
): CompoundMove | null {
  return searchBestMove(state, player, {
    timeMs,
    maxDepth: 7,
    useTranspositionTable: true,
  });
}

/** Presets aligned with web difficulty (engine-side for sims). */
export function searchOptionsForDifficulty(
  level: "easy" | "medium" | "hard",
): SearchOptions {
  switch (level) {
    case "easy":
      return {
        timeMs: 200,
        maxDepth: 3,
        easyNoise: true,
        easyTopK: 3,
        useTranspositionTable: false,
      };
    case "hard":
      return {
        timeMs: 1200,
        maxDepth: 6,
        useTranspositionTable: true,
      };
    default:
      return {
        timeMs: 600,
        maxDepth: 5,
        useTranspositionTable: true,
      };
  }
}
