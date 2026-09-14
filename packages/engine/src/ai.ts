import type { TileValue } from "./constants.js";
import { getLineCells, getScoringLines } from "./lines.js";
import {
  addContributions,
  analyzeLine,
  emptyLevelCounts,
} from "./patterns.js";
import { evaluateGame } from "./scoring.js";
import { applyAction, getLegalActions } from "./state.js";
import type { GameState, LevelCounts, PlayerId } from "./types.js";
import { compareLevelCounts, resolveWinner } from "./winner.js";

export interface CompoundMove {
  select: TileValue;
  place: number;
}

const LEVEL_WEIGHT: Record<2 | 3 | 4 | 5, number> = {
  2: 10,
  3: 100,
  4: 1000,
  5: 10_000,
};

const WIN_SCORE = 1_000_000;

function weightedLevels(counts: LevelCounts): number {
  return (
    counts[2] * LEVEL_WEIGHT[2] +
    counts[3] * LEVEL_WEIGHT[3] +
    counts[4] * LEVEL_WEIGHT[4] +
    counts[5] * LEVEL_WEIGHT[5]
  );
}

function partialPerspectiveScore(
  board: GameState["board"],
  perspective: "rows" | "columns",
): number {
  let complete = emptyLevelCounts();
  let partial = 0;
  for (const line of getScoringLines(perspective)) {
    const cells = getLineCells(board, line.indices);
    if (cells.length === 6) {
      addContributions(complete, analyzeLine(cells).contributions);
    } else if (cells.length > 0) {
      const a = analyzeLine(cells);
      partial += a.R * 2 + a.D * 3 + cells.length;
    }
  }
  return weightedLevels(complete) + partial;
}

/** Heuristic from `rootPlayer`'s perspective (positive = good for root). */
export function evaluatePosition(state: GameState, rootPlayer: PlayerId): number {
  if (state.phase.kind === "ended") {
    const r = state.phase.result;
    if (r.outcome === "draw") return 0;
    return r.winner === rootPlayer ? WIN_SCORE : -WIN_SCORE;
  }

  if (state.board.every((c) => c !== null)) {
    const { levels, ledger } = evaluateGame(state);
    const result = resolveWinner(levels, ledger);
    if (result.outcome === "draw") return 0;
    return result.winner === rootPlayer ? WIN_SCORE : -WIN_SCORE;
  }

  const rows = partialPerspectiveScore(state.board, "rows");
  const cols = partialPerspectiveScore(state.board, "columns");
  return rootPlayer === 1 ? rows - cols : cols - rows;
}

export function getLegalCompoundMoves(state: GameState): CompoundMove[] {
  if (state.phase.kind === "ended") return [];

  if (state.phase.kind === "place") {
    const selected = state.phase.selected;
    return getLegalActions(state)
      .filter((a) => a.type === "PLACE")
      .map((a) => ({
        select: selected,
        place: a.index,
      }));
  }

  const moves: CompoundMove[] = [];
  for (const sel of getLegalActions(state)) {
    if (sel.type !== "SELECT") continue;
    const afterSel = applyAction(state, { type: "SELECT", value: sel.value });
    if (!afterSel.ok) continue;
    for (const pl of getLegalActions(afterSel.value)) {
      if (pl.type !== "PLACE") continue;
      moves.push({ select: sel.value, place: pl.index });
    }
  }
  return moves;
}

export function applyCompoundMove(
  state: GameState,
  move: CompoundMove,
): GameState | null {
  if (state.phase.kind === "place") {
    if (state.phase.selected !== move.select) return null;
    const r = applyAction(state, { type: "PLACE", index: move.place });
    return r.ok ? r.value : null;
  }
  const s1 = applyAction(state, { type: "SELECT", value: move.select });
  if (!s1.ok) return null;
  const s2 = applyAction(s1.value, { type: "PLACE", index: move.place });
  return s2.ok ? s2.value : null;
}

function moveOrderScore(
  state: GameState,
  move: CompoundMove,
  pov: PlayerId,
): number {
  const next = applyCompoundMove(state, move);
  if (!next) return -Infinity;
  return evaluatePosition(next, pov);
}

function negamax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  rootPlayer: PlayerId,
  deadline: number,
): number {
  if (Date.now() >= deadline) {
    return evaluatePosition(state, rootPlayer);
  }
  if (state.phase.kind === "ended" || depth === 0) {
    return evaluatePosition(state, rootPlayer);
  }

  const moves = getLegalCompoundMoves(state);
  if (moves.length === 0) return evaluatePosition(state, rootPlayer);

  moves.sort(
    (a, b) => moveOrderScore(state, b, rootPlayer) - moveOrderScore(state, a, rootPlayer),
  );

  let best = -Infinity;
  for (const move of moves) {
    const next = applyCompoundMove(state, move);
    if (!next) continue;
    const score = -negamax(next, depth - 1, -beta, -alpha, rootPlayer, deadline);
    best = Math.max(best, score);
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }
  return best;
}

export interface SearchOptions {
  timeMs?: number;
  maxDepth?: number;
  /** Easy: randomize among top moves at shallow depth */
  easyNoise?: boolean;
}

export function searchBestMove(
  state: GameState,
  forPlayer: PlayerId,
  options: SearchOptions = {},
): CompoundMove | null {
  if (state.phase.kind === "ended") return null;
  if (state.phase.player !== forPlayer) return null;

  const timeMs = options.timeMs ?? 800;
  const maxDepth = options.maxDepth ?? 4;
  const deadline = Date.now() + timeMs;
  const moves = getLegalCompoundMoves(state);
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0] ?? null;

  if (options.easyNoise) {
    return pickEasyNoisyMove(state, moves, forPlayer);
  }

  let bestMove: CompoundMove | null = null;
  let bestScore = -Infinity;

  for (let depth = 1; depth <= maxDepth; depth++) {
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
      );
      if (score > layerScore) {
        layerScore = score;
        layerBest = move;
      }
      if (Date.now() >= deadline) break;
    }

    if (layerBest) {
      bestMove = layerBest;
      bestScore = layerScore;
    }
    if (Date.now() >= deadline) break;
  }

  return bestMove ?? moves[0] ?? null;
}

function pickEasyNoisyMove(
  state: GameState,
  moves: CompoundMove[],
  forPlayer: PlayerId,
): CompoundMove | null {
  const scored: { move: CompoundMove; score: number }[] = [];
  for (const move of moves) {
    const next = applyCompoundMove(state, move);
    if (!next) continue;
    scored.push({
      move,
      score: evaluatePosition(next, forPlayer),
    });
  }
  if (scored.length === 0) return null;
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.min(3, scored.length));
  return top[Math.floor(Math.random() * top.length)]?.move ?? null;
}

/** Node / sim helper: bot as P2 vs random P1. */
export function pickSearchMove(
  state: GameState,
  player: PlayerId,
  timeMs: number,
): CompoundMove | null {
  return searchBestMove(state, player, { timeMs, maxDepth: 5 });
}
