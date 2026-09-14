import { BOARD_SIZE, CELL_COUNT, type TileValue } from "./constants.js";
import type { Perspective } from "./types.js";

export type { Perspective };

export interface ScoringLine {
  id: string;
  label: string;
  indices: number[];
}

function rowIndices(r: number): number[] {
  const start = r * BOARD_SIZE;
  return Array.from({ length: BOARD_SIZE }, (_, c) => start + c);
}

function colIndices(c: number): number[] {
  return Array.from({ length: BOARD_SIZE }, (_, r) => r * BOARD_SIZE + c);
}

const DIAG_SE = [0, 7, 14, 21, 28, 35];
const DIAG_SW = [5, 10, 15, 20, 25, 30];

export function getScoringLines(perspective: Perspective): ScoringLine[] {
  const lines: ScoringLine[] = [];
  if (perspective === "rows") {
    for (let r = 0; r < BOARD_SIZE; r++) {
      lines.push({
        id: `row-${r}`,
        label: `Row ${r + 1}`,
        indices: rowIndices(r),
      });
    }
  } else {
    for (let c = 0; c < BOARD_SIZE; c++) {
      lines.push({
        id: `col-${c}`,
        label: `Column ${c + 1}`,
        indices: colIndices(c),
      });
    }
  }
  lines.push({
    id: "diag-se",
    label: "Diagonal ↘",
    indices: [...DIAG_SE],
  });
  lines.push({
    id: "diag-sw",
    label: "Diagonal ↙",
    indices: [...DIAG_SW],
  });
  return lines;
}

export function indexToRowCol(index: number): { row: number; col: number } {
  if (index < 0 || index >= CELL_COUNT) {
    throw new RangeError(`Invalid index ${index}`);
  }
  return { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE };
}

export function rowColToIndex(row: number, col: number): number {
  return row * BOARD_SIZE + col;
}

export function getLineCells(
  board: (TileValue | null)[],
  indices: number[],
): TileValue[] {
  const cells: TileValue[] = [];
  for (const i of indices) {
    const v = board[i];
    if (v !== null) cells.push(v);
  }
  return cells;
}
