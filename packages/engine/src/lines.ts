import { BOARD_SIZE, CELL_COUNT, type TileValue } from "./constants.js";
import type { CellValue, Perspective } from "./types.js";

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

/** All board indices with (row - col) === k, in increasing row order. */
export function indicesWithRowMinusCol(k: number): number[] {
  const out: number[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const col = row - k;
    if (col >= 0 && col < BOARD_SIZE) out.push(row * BOARD_SIZE + col);
  }
  return out;
}

/** All board indices with (row + col) === k, in increasing row order. */
export function indicesWithRowPlusCol(k: number): number[] {
  const out: number[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const col = k - row;
    if (col >= 0 && col < BOARD_SIZE) out.push(row * BOARD_SIZE + col);
  }
  return out;
}

const DIAG_SE = indicesWithRowMinusCol(0);
const DIAG_SE_NE = indicesWithRowMinusCol(-1);
const DIAG_SE_SW = indicesWithRowMinusCol(1);
const DIAG_SW = indicesWithRowPlusCol(5);
const DIAG_SW_NW = indicesWithRowPlusCol(4);
const DIAG_SW_SE = indicesWithRowPlusCol(6);

/** Filled tile values along line indices, in index order (partial lines OK). */
export function getFilledLineCells(
  board: CellValue[],
  indices: number[],
): TileValue[] {
  return getLineCells(board, indices);
}

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
    lines.push({
      id: "diag-se",
      label: "Diagonal ↘",
      indices: [...DIAG_SE],
    });
    lines.push({
      id: "diag-se-ne",
      label: "↘ upper",
      indices: [...DIAG_SE_NE],
    });
    lines.push({
      id: "diag-se-sw",
      label: "↘ lower",
      indices: [...DIAG_SE_SW],
    });
  } else {
    for (let c = 0; c < BOARD_SIZE; c++) {
      lines.push({
        id: `col-${c}`,
        label: `Column ${c + 1}`,
        indices: colIndices(c),
      });
    }
    lines.push({
      id: "diag-sw",
      label: "Diagonal ↙",
      indices: [...DIAG_SW],
    });
    lines.push({
      id: "diag-sw-nw",
      label: "↙ upper",
      indices: [...DIAG_SW_NW],
    });
    lines.push({
      id: "diag-sw-se",
      label: "↙ lower",
      indices: [...DIAG_SW_SE],
    });
  }
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
