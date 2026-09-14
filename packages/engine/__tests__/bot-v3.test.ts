import { describe, expect, it } from "vitest";
import {
  applyCompoundMove,
  chooseBotMove,
  createInitialState,
  getLegalCompoundMoves,
  getScoringLines,
  searchOptionsForDifficulty,
} from "../src/index.js";
import {
  buildThreatMap,
  moveBlocksOpponentThreat,
} from "../src/ai-threat-map.js";
import { scoreAllMovesFast, scoreMoveFast } from "../src/ai-fast-score.js";
import { createSearchContext } from "../src/ai-search-context.js";
import type { CellValue } from "../src/types.js";

describe("buildThreatMap", () => {
  it("T1: detects sole empty opponent finish", () => {
    const board = Array(36).fill(null) as CellValue[];
    const col0 = getScoringLines("columns")[0]!.indices;
    for (let i = 0; i < 5; i++) board[col0[i]!] = (i + 1) as 1 | 2 | 3 | 4 | 5;
    const emptyCell = col0[5]!;
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
    const tm = buildThreatMap(s, 1);
    expect(moveBlocksOpponentThreat(tm, emptyCell)).toBe(true);
  });
});

describe("scoreMoveFast", () => {
  it("F1: completing row ranks first", () => {
    const board = Array(36).fill(null) as CellValue[];
    const row0 = getScoringLines("rows")[0]!.indices;
    for (let i = 0; i < 5; i++) board[row0[i]!] = (i + 1) as 1 | 2 | 3 | 4 | 5;
    let s = createInitialState();
    s = { ...s, board, phase: { kind: "select", player: 1 } };
    const tm = buildThreatMap(s, 1);
    const complete = { select: 5 as const, place: row0[5]! };
    expect(scoreMoveFast(s, complete, 1, tm)?.completesLine).toBe(true);
    const scored = scoreAllMovesFast(
      s,
      getLegalCompoundMoves(s),
      1,
      tm,
      createSearchContext(500),
    );
    expect(scored[0]?.move.place).toBe(row0[5]);
  });
});

describe("chooseBotMove v3", () => {
  it("returns legal medium move", () => {
    const s = createInitialState();
    const move = chooseBotMove(s, 1, searchOptionsForDifficulty("medium"));
    expect(move).not.toBeNull();
    const next = applyCompoundMove(s, move!);
    expect(next?.phase.kind === "select" && next.phase.player).toBe(2);
  });
});
