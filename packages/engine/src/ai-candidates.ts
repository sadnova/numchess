import { LEVEL_WEIGHT } from "./ai-weights.js";
import { compoundMoveKey, sameCompoundMove, type CompoundMove } from "./ai-moves.js";
import type { MoveFastScore } from "./ai-fast-score.js";

const TACTICAL_CAP = 10;

export function collectTacticalMoves(scored: MoveFastScore[]): CompoundMove[] {
  const out: CompoundMove[] = [];
  for (const s of scored) {
    if (
      s.completesLine ||
      s.blocksSole ||
      s.liveGain >= LEVEL_WEIGHT[4]
    ) {
      out.push(s.move);
    }
  }
  return out;
}

export function selectSearchCandidates(
  scored: MoveFastScore[],
  topK: number,
  tacticalMoves: CompoundMove[],
  pvMove?: CompoundMove,
): CompoundMove[] {
  const seen = new Set<string>();
  const out: CompoundMove[] = [];

  const add = (move: CompoundMove) => {
    const k = compoundMoveKey(move);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(move);
  };

  if (pvMove) add(pvMove);
  for (const t of tacticalMoves) add(t);

  let ranked = 0;
  for (const s of scored) {
    add(s.move);
    ranked++;
    if (ranked >= topK && out.length >= topK) break;
  }

  return out.slice(0, topK + TACTICAL_CAP);
}
