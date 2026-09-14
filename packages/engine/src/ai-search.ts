import { getLegalCompoundMoves } from "./ai-moves.js";
import { selectBotMove } from "./bot-move-selector.js";
import type { SearchOptions } from "./ai-search-types.js";
import type { GameState, PlayerId } from "./types.js";

function defaultV3Options(options: SearchOptions): SearchOptions {
  if (options.searchTopK !== undefined) return options;
  return { searchTopK: 12, ...options };
}

export function searchBestMove(
  state: GameState,
  forPlayer: PlayerId,
  options: SearchOptions = {},
): ReturnType<typeof selectBotMove> {
  return selectBotMove(state, forPlayer, defaultV3Options(options));
}

export function chooseBotMove(
  state: GameState,
  forPlayer: PlayerId,
  options: SearchOptions = {},
): ReturnType<typeof selectBotMove> {
  if (state.phase.kind === "ended") return null;
  if (state.phase.player !== forPlayer) return null;

  const moves = getLegalCompoundMoves(state);
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0] ?? null;

  try {
    const picked = selectBotMove(state, forPlayer, defaultV3Options(options));
    if (picked) return picked;
  } catch {
    // fall through
  }

  return moves[0] ?? null;
}

export function pickSearchMove(
  state: GameState,
  player: PlayerId,
  timeMs: number,
): ReturnType<typeof selectBotMove> {
  return chooseBotMove(state, player, {
    timeMs,
    maxDepth: 5,
    searchTopK: 12,
    useTranspositionTable: true,
  });
}

export function searchOptionsForDifficulty(
  level: "easy" | "medium" | "hard",
): SearchOptions {
  switch (level) {
    case "easy":
      return {
        timeMs: 120,
        maxDepth: 2,
        searchTopK: 8,
        childTopK: 6,
        quiescenceDepth: 0,
        easyNoise: true,
        easyTopK: 3,
        useTranspositionTable: false,
      };
    case "hard":
      return {
        timeMs: 600,
        maxDepth: 7,
        searchTopK: 16,
        childTopK: 10,
        quiescenceDepth: 2,
        useTranspositionTable: true,
      };
    default:
      return {
        timeMs: 300,
        maxDepth: 5,
        searchTopK: 12,
        childTopK: 8,
        quiescenceDepth: 2,
        useTranspositionTable: true,
      };
  }
}

export type { SearchOptions } from "./ai-search-types.js";
