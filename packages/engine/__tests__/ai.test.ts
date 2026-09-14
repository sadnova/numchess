import { describe, expect, it } from "vitest";
import {
  applyCompoundMove,
  createInitialState,
  evaluatePosition,
  getLegalCompoundMoves,
  searchBestMove,
} from "../src/index.js";

describe("getLegalCompoundMoves", () => {
  it("starts with 180 compound moves on empty board", () => {
    const s = createInitialState();
    expect(getLegalCompoundMoves(s)).toHaveLength(180);
  });
});

describe("applyCompoundMove", () => {
  it("applies select and place", () => {
    const s = createInitialState();
    const move = { select: 3 as const, place: 0 };
    const next = applyCompoundMove(s, move);
    expect(next?.board[0]).toBe(3);
    expect(next?.phase).toEqual({ kind: "select", player: 2 });
  });
});

describe("searchBestMove", () => {
  it("returns a legal compound move for player 1", () => {
    const s = createInitialState();
    const move = searchBestMove(s, 1, { timeMs: 50, maxDepth: 2 });
    expect(move).not.toBeNull();
    const next = applyCompoundMove(s, move!);
    expect(next?.phase.kind === "select" && next.phase.player).toBe(2);
  });
});

describe("evaluatePosition", () => {
  it("is zero at start", () => {
    const s = createInitialState();
    expect(evaluatePosition(s, 1)).toBe(0);
    expect(evaluatePosition(s, 2)).toBe(0);
  });
});
