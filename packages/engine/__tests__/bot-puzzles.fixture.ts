import type { CompoundMove } from "../src/ai-moves.js";
import { createInitialState } from "../src/state.js";
import { getScoringLines } from "../src/lines.js";
import type { CellValue, GameState, PlayerId, TileValue } from "../src/types.js";

export type BotPuzzle = {
  id: string;
  player: PlayerId;
  state: GameState;
  expected: Pick<CompoundMove, "place"> & { select?: TileValue };
};

function patchBoard(
  fills: { index: number; value: TileValue }[],
  phase: GameState["phase"],
  inventories?: GameState["inventories"],
): GameState {
  const board = Array(36).fill(null) as CellValue[];
  for (const f of fills) board[f.index] = f.value;
  const base = createInitialState();
  return {
    ...base,
    board,
    phase,
    inventories: inventories ?? base.inventories,
  };
}

/** P1: complete row 0 L5 diversity (sixth cell). */
function puzzleCompleteRow(): BotPuzzle {
  const row0 = getScoringLines("rows")[0]!.indices;
  const fills = row0.slice(0, 5).map((index, i) => ({
    index,
    value: (i + 1) as TileValue,
  }));
  return {
    id: "P1",
    player: 1,
    state: patchBoard(fills, { kind: "select", player: 1 }),
    expected: { select: 5, place: row0[5]! },
  };
}

/** P2: block opponent column 0 sole empty. */
function puzzleBlockColumn(): BotPuzzle {
  const col0 = getScoringLines("columns")[0]!.indices;
  const fills = col0.slice(0, 5).map((index, i) => ({
    index,
    value: (i + 1) as TileValue,
  }));
  const inventories: GameState["inventories"] = [
    { counts: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 } },
    { counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 } },
  ];
  return {
    id: "P2",
    player: 1,
    state: patchBoard(
      fills,
      { kind: "select", player: 1 },
      inventories,
    ),
    expected: { place: col0[5]! },
  };
}

/** P3: complete 5-cell flank diag-se-ne. */
function puzzleFlank(): BotPuzzle {
  const flank = getScoringLines("rows").find((l) => l.id === "diag-se-ne")!
    .indices;
  const fills = flank.slice(0, 4).map((index, i) => ({
    index,
    value: (i + 1) as TileValue,
  }));
  return {
    id: "P3",
    player: 1,
    state: patchBoard(fills, { kind: "select", player: 1 }),
    expected: { select: 5, place: flank[4]! },
  };
}

export const BOT_PUZZLES: BotPuzzle[] = [
  puzzleCompleteRow(),
  puzzleBlockColumn(),
  puzzleFlank(),
];
