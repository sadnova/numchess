import { analyzePositionForPlayer } from "./analysis.js";
import type { ThreatBand } from "./analysis.js";
import { AI_EVAL_WEIGHTS, WIN_SCORE, weightedLevels } from "./ai-weights.js";
import {
  evaluateGame,
  scoreLinesFromBoard,
  scoreLiveLevels,
  liveScoreLeader,
} from "./scoring.js";
import type { GameState, PlayerId } from "./types.js";
import { resolveWinner } from "./winner.js";

function bandOwnScore(band: ThreatBand): number {
  return AI_EVAL_WEIGHTS.own[band];
}

function bandOppPenalty(band: ThreatBand): number {
  return AI_EVAL_WEIGHTS.opp[band];
}

/** Live HUD-aligned material (positive favors root). */
export function evalLiveLevelDiff(
  state: GameState,
  rootPlayer: PlayerId,
): number {
  const config = state.config;
  const rows = scoreLinesFromBoard(state.board, "rows", config).counts;
  const cols = scoreLinesFromBoard(state.board, "columns", config).counts;
  const rowsW = weightedLevels(rows);
  const colsW = weightedLevels(cols);
  return rootPlayer === 1 ? rowsW - colsW : colsW - rowsW;
}

function evalLexBonus(state: GameState, rootPlayer: PlayerId): number {
  const { leader, decisiveLevel } = liveScoreLeader(
    scoreLiveLevels(state),
    state.config,
  );
  if (leader === null || decisiveLevel === null) return 0;
  const magnitude = (6 - decisiveLevel) * AI_EVAL_WEIGHTS.lexPerLevel;
  return leader === rootPlayer ? magnitude : -magnitude;
}

export function evalInsightTerms(
  state: GameState,
  rootPlayer: PlayerId,
): number {
  const opponent: PlayerId = rootPlayer === 1 ? 2 : 1;
  let score = 0;
  for (const ins of analyzePositionForPlayer(state, rootPlayer)) {
    score += bandOwnScore(ins.band);
  }
  for (const ins of analyzePositionForPlayer(state, opponent)) {
    score -= bandOppPenalty(ins.band);
  }
  return score;
}

/** Heuristic from `rootPlayer`'s perspective (positive = good for root). */
export function evaluatePosition(
  state: GameState,
  rootPlayer: PlayerId,
  opts?: { fast?: boolean },
): number {
  if (state.phase.kind === "ended") {
    const r = state.phase.result;
    if (r.outcome === "draw") return 0;
    return r.winner === rootPlayer ? WIN_SCORE : -WIN_SCORE;
  }

  if (state.board.every((c) => c !== null)) {
    const { levels, ledger } = evaluateGame(state);
    const result = resolveWinner(levels, ledger, state.config);
    if (result.outcome === "draw") return 0;
    return result.winner === rootPlayer ? WIN_SCORE : -WIN_SCORE;
  }

  const material =
    evalLiveLevelDiff(state, rootPlayer) + evalLexBonus(state, rootPlayer);
  if (opts?.fast) return material;

  return material + evalInsightTerms(state, rootPlayer);
}

/** Search static eval: live material + lex only (no insight bands). */
export function evaluateStatic(
  state: GameState,
  rootPlayer: PlayerId,
): number {
  return evaluatePosition(state, rootPlayer, { fast: true });
}
