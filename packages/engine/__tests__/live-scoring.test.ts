import { describe, expect, it } from "vitest";
import {
  applyAction,
  createInitialState,
  evaluateGame,
  getLegalActions,
  getScoringLines,
  isLineComplete,
  lineScoreDelta,
  linesNewlyCompleted,
  liveScoreLeader,
  scoreCompletedLines,
  scoreLiveLevels,
} from "../src/index.js";

describe("isLineComplete", () => {
  it("false when any cell empty", () => {
    const board = Array(36).fill(null) as (number | null)[];
    const row0 = getScoringLines("rows")[0]!.indices;
    board[row0[0]!] = 1;
    expect(isLineComplete(board, row0)).toBe(false);
  });

  it("true when all six filled", () => {
    const board = Array(36).fill(null) as (number | null)[];
    const row0 = getScoringLines("rows")[0]!.indices;
    for (let i = 0; i < 6; i++) board[row0[i]!] = i + 1;
    expect(isLineComplete(board, row0)).toBe(true);
  });
});

describe("scoreLiveLevels", () => {
  it("empty board has zero levels", () => {
    const s = createInitialState();
    const live = scoreLiveLevels(s);
    expect(live.rows).toEqual({ 2: 0, 3: 0, 4: 0, 5: 0 });
    expect(live.columns).toEqual({ 2: 0, 3: 0, 4: 0, 5: 0 });
  });

  it("matches evaluateGame when board full", () => {
    let s = createInitialState();
    let safety = 0;
    while (s.phase.kind !== "ended" && safety++ < 200) {
      const actions = getLegalActions(s);
      const a = actions[0]!;
      if (a.type === "SELECT") {
        s = applyAction(s, { type: "SELECT", value: a.value }).value!;
      } else {
        s = applyAction(s, { type: "PLACE", index: a.index }).value!;
      }
    }
    expect(s.phase.kind).toBe("ended");
    const live = scoreLiveLevels(s);
    const official = evaluateGame(s);
    expect(live).toEqual(official.levels);
  });
});

describe("scoreCompletedLines", () => {
  it("empty board has zero levels", () => {
    const s = createInitialState();
    const live = scoreCompletedLines(s);
    expect(live.levels.rows).toEqual({ 2: 0, 3: 0, 4: 0, 5: 0 });
    expect(live.levels.columns).toEqual({ 2: 0, 3: 0, 4: 0, 5: 0 });
  });

  it("matches evaluateGame when board full", () => {
    let s = createInitialState();
    let safety = 0;
    while (s.phase.kind !== "ended" && safety++ < 200) {
      const actions = getLegalActions(s);
      const a = actions[0]!;
      if (a.type === "SELECT") {
        s = applyAction(s, { type: "SELECT", value: a.value }).value!;
      } else {
        s = applyAction(s, { type: "PLACE", index: a.index }).value!;
      }
    }
    expect(s.phase.kind).toBe("ended");
    const live = scoreCompletedLines(s);
    const official = evaluateGame(s);
    expect(live.levels).toEqual(official.levels);
  });
});

describe("linesNewlyCompleted", () => {
  it("detects row completion on last cell", () => {
    const prev = Array(36).fill(null) as (number | null)[];
    const row0 = getScoringLines("rows")[0]!.indices;
    for (let i = 0; i < 5; i++) prev[row0[i]!] = 1;
    const next = [...prev];
    next[row0[5]!] = 2;
    const delta = linesNewlyCompleted(prev, next);
    expect(delta.player1).toHaveLength(1);
    expect(delta.player1[0]!.id).toBe("row-0");
    expect(delta.player2).toHaveLength(0);
  });

  it("↘ completion scores only for rows perspective", () => {
    const prev = Array(36).fill(null) as (number | null)[];
    const diag = getScoringLines("rows").find((l) => l.id === "diag-se")!.indices;
    for (let i = 0; i < 5; i++) prev[diag[i]!] = 1;
    const next = [...prev];
    next[diag[5]!] = 2;
    const delta = linesNewlyCompleted(prev, next);
    expect(delta.player1.some((e) => e.id === "diag-se")).toBe(true);
    expect(delta.player2.some((e) => e.id === "diag-se")).toBe(false);
  });
});

describe("lineScoreDelta", () => {
  it("detects L5 diversity when fifth distinct value placed on row", () => {
    const prev = Array(36).fill(null) as (number | null)[];
    const row0 = getScoringLines("rows")[0]!.indices;
    for (let i = 0; i < 4; i++) prev[row0[i]!] = (i + 1) as 1 | 2 | 3 | 4;
    const next = [...prev];
    next[row0[4]!] = 5;
    const delta = lineScoreDelta(prev, next);
    expect(delta.player1).toHaveLength(1);
    expect(delta.player1[0]!.analysis.contributions.some((c) => c.level === 5)).toBe(
      true,
    );
  });
});

describe("liveScoreLeader", () => {
  it("returns null when tied", () => {
    expect(
      liveScoreLeader({
        rows: { 2: 1, 3: 0, 4: 0, 5: 0 },
        columns: { 2: 1, 3: 0, 4: 0, 5: 0 },
      }),
    ).toEqual({ leader: null, decisiveLevel: null });
  });

  it("returns rows leader at highest differing level", () => {
    expect(
      liveScoreLeader({
        rows: { 2: 0, 3: 0, 4: 0, 5: 2 },
        columns: { 2: 0, 3: 0, 4: 0, 5: 1 },
      }),
    ).toEqual({ leader: 1, decisiveLevel: 5 });
  });
});
