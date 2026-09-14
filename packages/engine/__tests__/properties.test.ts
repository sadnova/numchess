import { expect, it } from "vitest";
import fc from "fast-check";
import {
  applyAction,
  CELL_COUNT,
  createInitialState,
  getLegalActions,
  GLOBAL_BOARD_TOTALS,
  type GameState,
} from "../src/index.js";

function playRandomLegal(state: GameState): GameState {
  const actions = getLegalActions(state);
  if (actions.length === 0) return state;
  const pick = actions[Math.floor(Math.random() * actions.length)]!;
  if (pick.type === "SELECT") {
    const r = applyAction(state, { type: "SELECT", value: pick.value });
    if (!r.ok) throw new Error(r.error);
    return r.value;
  }
  const r = applyAction(state, { type: "PLACE", index: pick.index });
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

it("random legal sequences end without throw", () => {
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 200 }), () => {
      let s = createInitialState();
      for (let i = 0; i < 400 && s.phase.kind !== "ended"; i++) {
        s = playRandomLegal(s);
      }
      if (s.phase.kind === "ended") {
        expect(s.board.filter((c) => c !== null).length).toBe(CELL_COUNT);
      }
    }),
    { numRuns: 50 },
  );
});

it("completed games match global tile totals", () => {
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 50 }), () => {
      let s = createInitialState();
      while (s.phase.kind !== "ended") {
        s = playRandomLegal(s);
      }
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      for (const c of s.board) {
        if (c !== null) counts[c] += 1;
      }
      expect(counts).toEqual(GLOBAL_BOARD_TOTALS);
    }),
    { numRuns: 30 },
  );
});
