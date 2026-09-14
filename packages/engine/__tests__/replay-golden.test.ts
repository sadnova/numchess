import { describe, expect, it } from "vitest";
import {
  applyAction,
  applyCompoundMove,
  createInitialState,
  getLegalActions,
} from "../src/index.js";

describe("replay history round-trip", () => {
  it("re-applies history to same board", () => {
    let s = createInitialState();
    const moves = [
      { select: 3 as const, place: 0 },
      { select: 4 as const, place: 6 },
      { select: 2 as const, place: 1 },
      { select: 1 as const, place: 7 },
    ];
    for (const m of moves) {
      s = applyCompoundMove(s, m)!;
    }
    let replay = createInitialState();
    for (const action of s.history) {
      replay = applyAction(replay, action).value!;
    }
    expect(replay.board).toEqual(s.board);
    expect(replay.inventories).toEqual(s.inventories);
  });
});

describe("full game replay", () => {
  it("ends with legal history only", () => {
    let s = createInitialState();
    let guard = 0;
    while (s.phase.kind !== "ended" && guard++ < 200) {
      const legal = getLegalActions(s);
      const a = legal[0];
      if (!a) break;
      if (a.type === "SELECT") {
        s = applyAction(s, { type: "SELECT", value: a.value }).value!;
      } else {
        s = applyAction(s, { type: "PLACE", index: a.index }).value!;
      }
    }
    expect(s.phase.kind).toBe("ended");
    expect(s.history.length).toBeGreaterThan(0);
  });
});
