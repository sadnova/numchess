import { describe, expect, it } from "vitest";
import {
  applyCompoundMove,
  compareLevelCounts,
  createInitialState,
  evalLiveLevelDiff,
  evaluatePosition,
  getScoringLines,
  scoreLiveLevels,
} from "../src/index.js";
import { blocksOpponentCritical } from "../src/ai-ordering.js";
import type { CellValue } from "../src/types.js";

describe("evalLiveLevelDiff / evaluatePosition invariants", () => {
  it("E1: zero at start", () => {
    const s = createInitialState();
    expect(evaluatePosition(s, 1)).toBe(0);
    expect(evaluatePosition(s, 2)).toBe(0);
    expect(evalLiveLevelDiff(s, 1)).toBe(0);
  });

  it("partial L5 diversity on row increases P1 eval", () => {
    const board = Array(36).fill(null) as CellValue[];
    const row0 = getScoringLines("rows")[0]!.indices;
    for (let i = 0; i < 5; i++) board[row0[i]!] = (i + 1) as 1 | 2 | 3 | 4 | 5;
    const s = createInitialState();
    const patched = { ...s, board };
    expect(evalLiveLevelDiff(patched, 1)).toBeGreaterThan(0);
    expect(evaluatePosition(patched, 1)).toBeGreaterThan(0);
    expect(evaluatePosition(patched, 2)).toBeLessThan(0);
  });

  it("diag-se fill affects P1 eval not P2 material diff sign", () => {
    const board = Array(36).fill(null) as CellValue[];
    const diag = getScoringLines("rows").find((l) => l.id === "diag-se")!.indices;
    for (let i = 0; i < 5; i++) board[diag[i]!] = (i + 1) as 1 | 2 | 3 | 4 | 5;
    const s = { ...createInitialState(), board };
    expect(evalLiveLevelDiff(s, 1)).toBeGreaterThan(0);
    const live = scoreLiveLevels(s);
    expect(live.rows[5]).toBeGreaterThanOrEqual(1);
  });

  it("G12: diag-se-ne flank fill increases P1 eval only", () => {
    const board = Array(36).fill(null) as CellValue[];
    const flank = getScoringLines("rows").find((l) => l.id === "diag-se-ne")!
      .indices;
    for (let i = 0; i < 5; i++) board[flank[i]!] = (i + 1) as 1 | 2 | 3 | 4 | 5;
    const s = { ...createInitialState(), board };
    expect(evalLiveLevelDiff(s, 1)).toBeGreaterThan(0);
    expect(evalLiveLevelDiff(s, 2)).toBeLessThan(0);
  });
});

describe("search ordering smoke G1", () => {
  it("completing L5 diversity sorts as high-gain move", () => {
    const board = Array(36).fill(null) as CellValue[];
    const row0 = getScoringLines("rows")[0]!.indices;
    for (let i = 0; i < 4; i++) board[row0[i]!] = (i + 1) as 1 | 2 | 3 | 4;
    let s = createInitialState();
    s = { ...s, board, phase: { kind: "select", player: 1 } };
    const move = { select: 5 as const, place: row0[4]! };
    const next = applyCompoundMove(s, move);
    expect(next).not.toBeNull();
    const { winner } = compareLevelCounts(
      scoreLiveLevels(next!).rows,
      scoreLiveLevels(next!).columns,
    );
    expect(winner).toBe(1);
  });

  it("blocksOpponentCritical detects single empty on 5-cell flank (B5)", () => {
    const board = Array(36).fill(null) as CellValue[];
    const flank = getScoringLines("columns").find((l) => l.id === "diag-sw-nw")!
      .indices;
    for (let i = 0; i < 4; i++) board[flank[i]!] = (i + 1) as 1 | 2 | 3 | 4;
    let s = createInitialState();
    s = {
      ...s,
      board,
      phase: { kind: "select", player: 1 },
      inventories: [
        { counts: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 } },
        { counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 } },
      ],
    };
    const blockMove = { select: 3 as const, place: flank[4]! };
    expect(blocksOpponentCritical(s, blockMove)).toBe(1);
  });
});
