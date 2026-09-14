import type { TileValue } from "./constants.js";
import { applyAction, getLegalActions } from "./state.js";
import type { GameState } from "./types.js";

export interface CompoundMove {
  select: TileValue;
  place: number;
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

export function compoundMoveKey(move: CompoundMove): string {
  return `${move.select}@${move.place}`;
}

export function sameCompoundMove(
  a: CompoundMove,
  b: CompoundMove | undefined,
): boolean {
  return b !== undefined && a.select === b.select && a.place === b.place;
}
