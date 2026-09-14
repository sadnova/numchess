import { describe, expect, it } from "vitest";
import {
  analyzePositionForPlayer,
  applyAction,
  cancelSelection,
  canReachL5OnLine,
  classifyLineBand,
  createInitialState,
  createSandboxState,
  type GameState,
  type TileValue,
} from "../src/index.js";

describe("cancelSelection", () => {
  it("returns to select phase", () => {
    let s = createInitialState();
    const sel = applyAction(s, { type: "SELECT", value: 3 });
    expect(sel.ok).toBe(true);
    if (!sel.ok) return;
    s = sel.value;
    const r = cancelSelection(s);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.phase).toEqual({ kind: "select", player: 1 });
    }
  });
});

describe("canReachL5OnLine", () => {
  it("needs a tile in inventory for the last slot (6-cell)", () => {
    const partial: TileValue[] = [5, 5, 5, 5, 5];
    const emptyInv = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    expect(canReachL5OnLine(partial, 1, emptyInv, 6)).toBe(false);
    expect(
      canReachL5OnLine(partial, 1, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 }, 6),
    ).toBe(true);
  });

  it("supports 5-cell flank lines (B1)", () => {
    const partial: TileValue[] = [1, 2, 3, 4];
    const emptyInv = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    expect(canReachL5OnLine(partial, 1, emptyInv, 5)).toBe(false);
    expect(
      canReachL5OnLine(partial, 1, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 }, 5),
    ).toBe(true);
  });
});

describe("classifyLineBand ghost threat", () => {
  it("downgrades critical-looking line when no tiles remain (6-cell)", () => {
    const cells: TileValue[] = [5, 5, 5, 5, 5];
    const emptyInv = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    expect(classifyLineBand(cells, emptyInv, 6)).toBe("threat");
  });

  it("downgrades 4/5 flank ghost when finishing tile missing (B2)", () => {
    const cells: TileValue[] = [5, 5, 5, 5];
    const emptyInv = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    expect(classifyLineBand(cells, emptyInv, 5)).toBe("threat");
  });

  it("marks 4/5 flank critical when tile exists", () => {
    const cells: TileValue[] = [1, 2, 3, 4];
    const inv = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2 };
    expect(classifyLineBand(cells, inv, 5)).toBe("critical");
  });
});

describe("analyzePositionForPlayer", () => {
  it("returns 9 insights", () => {
    const insights = analyzePositionForPlayer(createInitialState(), 1);
    expect(insights).toHaveLength(9);
  });

  it("marks a nearly complete line as critical when tile exists", () => {
    const s = createInitialState();
    const board = [...s.board];
    const row0 = [0, 1, 2, 3, 4, 5];
    for (let i = 0; i < 5; i++) {
      board[row0[i]!] = (i + 1) as TileValue;
    }
    board[5] = 5;
    const patched = { ...s, board };
    const rowInsight = analyzePositionForPlayer(patched, 1).find(
      (l) => l.lineId === "row-0",
    );
    expect(rowInsight?.band).toBe("critical");
  });

  it("marks ghost row as threat when inventories are empty", () => {
    const s = createInitialState();
    const board = [...s.board];
    for (let i = 0; i < 5; i++) board[i] = 5;
    const inventories: GameState["inventories"] = [
      { counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      { counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    ];
    const patched = { ...s, board, inventories };
    const rowInsight = analyzePositionForPlayer(patched, 1).find(
      (l) => l.lineId === "row-0",
    );
    expect(rowInsight?.band).toBe("threat");
  });

  it("marks early diversity as building", () => {
    const s = createInitialState();
    const board = [...s.board];
    board[0] = 2;
    board[1] = 3;
    board[2] = 4;
    const patched = { ...s, board };
    const rowInsight = analyzePositionForPlayer(patched, 1).find(
      (l) => l.lineId === "row-0",
    );
    expect(rowInsight?.band).toBe("building");
  });

  it("createSandboxState is midgame", () => {
    const s = createSandboxState();
    expect(s.board.some((c) => c !== null)).toBe(true);
    expect(s.phase.kind).not.toBe("ended");
  });
});
