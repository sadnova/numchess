import { describe, expect, it } from "vitest";
import {
  analyzePositionForPlayer,
  applyAction,
  createInitialState,
  evaluateGame,
  getLegalActions,
  getScoringLines,
  indicesWithRowMinusCol,
  indicesWithRowPlusCol,
  isLineComplete,
  lineScoreDelta,
  scoreLinesFromBoard,
  scoreLiveLevels,
} from "../src/index.js";

const FLANK_SE_NE = [1, 8, 15, 22, 29];
const FLANK_SE_SW = [6, 13, 20, 27, 34];
const FLANK_SW_NW = [4, 9, 14, 19, 24];
const FLANK_SW_SE = [11, 16, 21, 26, 31];

describe("flanking diagonals (rulesVersion 1.2.0)", () => {
  it("G1: nine lines per perspective (6 orthogonals + three diagonals)", () => {
    expect(getScoringLines("rows")).toHaveLength(9);
    expect(getScoringLines("columns")).toHaveLength(9);
  });

  it("G2: main diags length 6, flanks length 5", () => {
    const rows = getScoringLines("rows");
    expect(rows.find((l) => l.id === "diag-se")!.indices).toHaveLength(6);
    expect(rows.find((l) => l.id === "diag-se-ne")!.indices).toHaveLength(5);
    expect(rows.find((l) => l.id === "diag-se-sw")!.indices).toHaveLength(5);
    const cols = getScoringLines("columns");
    expect(cols.find((l) => l.id === "diag-sw")!.indices).toHaveLength(6);
    expect(cols.find((l) => l.id === "diag-sw-nw")!.indices).toHaveLength(5);
    expect(cols.find((l) => l.id === "diag-sw-se")!.indices).toHaveLength(5);
  });

  it("G3: frozen index arrays and generators match", () => {
    expect(indicesWithRowMinusCol(-1)).toEqual(FLANK_SE_NE);
    expect(indicesWithRowMinusCol(1)).toEqual(FLANK_SE_SW);
    expect(indicesWithRowPlusCol(4)).toEqual(FLANK_SW_NW);
    expect(indicesWithRowPlusCol(6)).toEqual(FLANK_SW_SE);
    expect(getScoringLines("rows").find((l) => l.id === "diag-se-ne")!.indices).toEqual(
      FLANK_SE_NE,
    );
  });

  it("G4: full 5/5 flank with 1–5 yields live L5", () => {
    const board = Array(36).fill(null) as (number | null)[];
    for (let i = 0; i < 5; i++) board[FLANK_SE_NE[i]!] = i + 1;
    const { counts } = scoreLinesFromBoard(board, "rows");
    expect(counts[5]).toBeGreaterThanOrEqual(1);
  });

  it("G6: flank scores only toward owning perspective", () => {
    const board = Array(36).fill(null) as (number | null)[];
    for (let i = 0; i < 5; i++) board[FLANK_SE_NE[i]!] = i + 1;
    const rows = scoreLinesFromBoard(board, "rows");
    const cols = scoreLinesFromBoard(board, "columns");
    expect(rows.ledger.some((e) => e.id === "diag-se-ne")).toBe(true);
    expect(cols.ledger.some((e) => e.id === "diag-se-ne")).toBe(false);
  });

  it("G7: nine insights on empty board", () => {
    const s = createInitialState();
    expect(analyzePositionForPlayer(s, 1)).toHaveLength(9);
    expect(analyzePositionForPlayer(s, 2)).toHaveLength(9);
  });

  it("G8: isLineComplete for 5-cell flank", () => {
    const board = Array(36).fill(null) as (number | null)[];
    const line = getScoringLines("rows").find((l) => l.id === "diag-se-ne")!.indices;
    expect(isLineComplete(board, line)).toBe(false);
    for (let i = 0; i < 4; i++) board[line[i]!] = 1;
    expect(isLineComplete(board, line)).toBe(false);
    board[line[4]!] = 2;
    expect(isLineComplete(board, line)).toBe(true);
  });

  it("G9: evaluateGame on full board includes flank ledger ids", () => {
    let s = createInitialState();
    while (s.phase.kind !== "ended") {
      const actions = getLegalActions(s);
      const place = actions.find((a) => a.type === "PLACE");
      if (place) {
        const r = applyAction(s, place);
        if (r.ok) s = r.value;
        continue;
      }
      const sel = actions.find((a) => a.type === "SELECT");
      if (sel) {
        const r = applyAction(s, sel);
        if (r.ok) s = r.value;
      }
    }
    const { ledger } = evaluateGame(s);
    const p1Ids = ledger.player1.map((e) => e.id);
    const p2Ids = ledger.player2.map((e) => e.id);
    expect(p1Ids).toContain("diag-se-ne");
    expect(p1Ids).toContain("diag-se-sw");
    expect(p2Ids).toContain("diag-sw-nw");
    expect(p2Ids).toContain("diag-sw-se");
    const live = scoreLiveLevels(s);
    const official = evaluateGame(s);
    expect(live.rows).toEqual(official.levels.rows);
    expect(live.columns).toEqual(official.levels.columns);
  });

  it("G10: lineScoreDelta when flank pattern gains a contribution", () => {
    const prev = Array(36).fill(null) as (number | null)[];
    const next = [...prev];
    next[FLANK_SE_NE[0]!] = 1;
    next[FLANK_SE_NE[1]!] = 2;
    const delta = lineScoreDelta(prev, next);
    expect(delta.player1.some((e) => e.id === "diag-se-ne")).toBe(true);
    expect(delta.player1.find((e) => e.id === "diag-se-ne")!.label).toBe("↘ upper");
  });
});

describe("split diagonal ownership (still 1.2.0)", () => {
  it("rows perspective has diag-se family only", () => {
    const ids = getScoringLines("rows").map((l) => l.id);
    expect(ids).toContain("diag-se");
    expect(ids).not.toContain("diag-sw");
    expect(ids.filter((id) => id.startsWith("row-"))).toHaveLength(6);
  });

  it("columns perspective has diag-sw family only", () => {
    const ids = getScoringLines("columns").map((l) => l.id);
    expect(ids).toContain("diag-sw");
    expect(ids).not.toContain("diag-se");
    expect(ids.filter((id) => id.startsWith("col-"))).toHaveLength(6);
  });
});
