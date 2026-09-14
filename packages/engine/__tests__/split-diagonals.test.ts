import { describe, expect, it } from "vitest";
import {
  analyzeLine,
  getScoringLines,
  scoreLinesFromBoard,
} from "../src/index.js";

describe("split diagonals (rulesVersion 1.2.0)", () => {
  it("rows perspective has diag-se only", () => {
    const ids = getScoringLines("rows").map((l) => l.id);
    expect(ids).toContain("diag-se");
    expect(ids).not.toContain("diag-sw");
    expect(ids.filter((id) => id.startsWith("row-"))).toHaveLength(6);
    expect(ids).toHaveLength(9);
  });

  it("columns perspective has diag-sw only", () => {
    const ids = getScoringLines("columns").map((l) => l.id);
    expect(ids).toContain("diag-sw");
    expect(ids).not.toContain("diag-se");
    expect(ids.filter((id) => id.startsWith("col-"))).toHaveLength(6);
    expect(ids).toHaveLength(9);
  });

  it("scores ↘ only toward rows", () => {
    const board = Array(36).fill(null) as (number | null)[];
    const diag = getScoringLines("rows").find((l) => l.id === "diag-se")!.indices;
    for (let i = 0; i < 6; i++) board[diag[i]!] = i + 1;
    const rows = scoreLinesFromBoard(board, "rows");
    const cols = scoreLinesFromBoard(board, "columns");
    expect(rows.ledger.some((e) => e.id === "diag-se")).toBe(true);
    expect(cols.ledger.some((e) => e.id === "diag-se")).toBe(false);
  });

  it("scores ↙ only toward columns", () => {
    const board = Array(36).fill(null) as (number | null)[];
    const diag = getScoringLines("columns").find((l) => l.id === "diag-sw")!
      .indices;
    for (let i = 0; i < 6; i++) board[diag[i]!] = i + 1;
    const rows = scoreLinesFromBoard(board, "rows");
    const cols = scoreLinesFromBoard(board, "columns");
    expect(cols.ledger.some((e) => e.id === "diag-sw")).toBe(true);
    expect(rows.ledger.some((e) => e.id === "diag-sw")).toBe(false);
  });
});

describe("partial row scoring", () => {
  it("five distinct values on a row yields L5 diversity live", () => {
    const board = Array(36).fill(null) as (number | null)[];
    const row0 = getScoringLines("rows")[0]!.indices;
    for (let i = 0; i < 5; i++) board[row0[i]!] = (i + 1) as 1 | 2 | 3 | 4 | 5;
    const { counts } = scoreLinesFromBoard(board, "rows");
    expect(counts[5]).toBeGreaterThanOrEqual(1);
    const cells = [1, 2, 3, 4, 5] as const;
    expect(analyzeLine([...cells]).D).toBe(5);
  });
});
