import { describe, expect, it } from "vitest";
import {
  analyzeLine,
  applyAction,
  CELL_COUNT,
  createInitialState,
  evaluateGame,
  getLegalActions,
  getScoringLines,
  resolveWinner,
  scoreBoth,
  STARTING_INVENTORY,
} from "../src/index.js";

describe("analyzeLine", () => {
  it("coexistence on 1 1 2 3 4 5", () => {
    const a = analyzeLine([1, 1, 2, 3, 4, 5]);
    expect(a.R).toBe(2);
    expect(a.D).toBe(5);
    expect(a.contributions).toHaveLength(2);
  });

  it("caps six ones at R=5", () => {
    const a = analyzeLine([1, 1, 1, 1, 1, 1]);
    expect(a.R).toBe(5);
    expect(a.D).toBe(1);
    expect(a.contributions).toHaveLength(1);
  });
});

describe("getScoringLines", () => {
  it("returns 8 lines per perspective", () => {
    expect(getScoringLines("rows")).toHaveLength(8);
    expect(getScoringLines("columns")).toHaveLength(8);
  });
});

describe("moves", () => {
  it("starts with player 1 select", () => {
    const s = createInitialState();
    expect(s.phase).toEqual({ kind: "select", player: 1 });
    expect(getLegalActions(s).every((a) => a.type === "SELECT")).toBe(true);
  });

  it("select then place flow", () => {
    let s = createInitialState();
    const sel = applyAction(s, { type: "SELECT", value: 3 });
    expect(sel.ok).toBe(true);
    if (!sel.ok) return;
    s = sel.value;
    expect(s.phase.kind).toBe("place");
    const place = applyAction(s, { type: "PLACE", index: 0 });
    expect(place.ok).toBe(true);
    if (!place.ok) return;
    s = place.value;
    expect(s.board[0]).toBe(3);
    expect(s.phase).toEqual({ kind: "select", player: 2 });
  });

  it("rejects occupied cell", () => {
    let s = createInitialState();
    s = applyAction(s, { type: "SELECT", value: 1 }).value!;
    s = applyAction(s, { type: "PLACE", index: 5 }).value!;
    s = applyAction(s, { type: "SELECT", value: 2 }).value!;
    const bad = applyAction(s, { type: "PLACE", index: 5 });
    expect(bad.ok).toBe(false);
  });

  it("fills board in 36 placements", () => {
    let s = createInitialState();
    let safety = 0;
    while (s.phase.kind !== "ended" && safety++ < 200) {
      const actions = getLegalActions(s);
      expect(actions.length).toBeGreaterThan(0);
      const a = actions[0];
      if (a.type === "SELECT") {
        const r = applyAction(s, { type: "SELECT", value: a.value });
        expect(r.ok).toBe(true);
        s = r.value!;
      } else {
        const r = applyAction(s, { type: "PLACE", index: a.index });
        expect(r.ok).toBe(true);
        s = r.value!;
      }
    }
    expect(s.phase.kind).toBe("ended");
    expect(s.ply).toBe(CELL_COUNT);
  });
});

describe("winner", () => {
  it("lexicographic prefers level 5", () => {
    const levels = {
      rows: { 2: 0, 3: 0, 4: 0, 5: 2 },
      columns: { 2: 0, 3: 0, 4: 9, 5: 1 },
    };
    const ledger = { player1: [], player2: [] };
    const r = resolveWinner(levels, ledger);
    expect(r.outcome).toBe("win");
    if (r.outcome === "win") {
      expect(r.winner).toBe(1);
      expect(r.decisiveLevel).toBe(5);
    }
  });
});

describe("inventory", () => {
  it("starting counts match spec", () => {
    const s = createInitialState();
    expect(s.inventories[0].counts).toEqual(STARTING_INVENTORY);
  });
});
