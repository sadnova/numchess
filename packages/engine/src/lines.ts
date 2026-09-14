import { BOARD_SIZE, DEFAULT_GAME_CONFIG, type GameConfig, type TileValue } from "./constants.js";
import type { CellValue, Perspective } from "./types.js";

export type { Perspective };

export interface ScoringLine {
  id: string;
  label: string;
  indices: number[];
}

function rowIndices(r: number, boardSize: number): number[] {
  const start = r * boardSize;
  return Array.from({ length: boardSize }, (_, c) => start + c);
}

function colIndices(c: number, boardSize: number): number[] {
  return Array.from({ length: boardSize }, (_, r) => r * boardSize + c);
}

/** All board indices with (row - col) === k, in increasing row order. */
export function indicesWithRowMinusCol(k: number, boardSize = BOARD_SIZE): number[] {
  const out: number[] = [];
  for (let row = 0; row < boardSize; row++) {
    const col = row - k;
    if (col >= 0 && col < boardSize) out.push(row * boardSize + col);
  }
  return out;
}

/** All board indices with (row + col) === k, in increasing row order. */
export function indicesWithRowPlusCol(k: number, boardSize = BOARD_SIZE): number[] {
  const out: number[] = [];
  for (let row = 0; row < boardSize; row++) {
    const col = k - row;
    if (col >= 0 && col < boardSize) out.push(row * boardSize + col);
  }
  return out;
}

function rowMinusColDiagonals(config: GameConfig): { id: string; label: string; k: number }[] {
  if (config.boardMode === "strategic") {
    return [
      { id: "diag-se", label: "Diagonal ↘", k: 0 },
      { id: "diag-se-ne", label: "↘ upper", k: -1 },
      { id: "diag-se-sw", label: "↘ lower", k: 1 },
      { id: "diag-se-ne2", label: "↘ far upper", k: -2 },
      { id: "diag-se-sw2", label: "↘ far lower", k: 2 },
    ];
  }
  return [
    { id: "diag-se", label: "Diagonal ↘", k: 0 },
    { id: "diag-se-ne", label: "↘ upper", k: -1 },
    { id: "diag-se-sw", label: "↘ lower", k: 1 },
  ];
}

function rowPlusColDiagonals(config: GameConfig): { id: string; label: string; k: number }[] {
  const n = config.boardSize;
  const main = n - 1;
  if (config.boardMode === "strategic") {
    return [
      { id: "diag-sw", label: "Diagonal ↙", k: main },
      { id: "diag-sw-nw", label: "↙ upper", k: main - 1 },
      { id: "diag-sw-se", label: "↙ lower", k: main + 1 },
      { id: "diag-sw-nw2", label: "↙ far upper", k: main - 2 },
      { id: "diag-sw-se2", label: "↙ far lower", k: main + 2 },
    ];
  }
  return [
    { id: "diag-sw", label: "Diagonal ↙", k: main },
    { id: "diag-sw-nw", label: "↙ upper", k: main - 1 },
    { id: "diag-sw-se", label: "↙ lower", k: main + 1 },
  ];
}

/** Filled tile values along line indices, in index order (partial lines OK). */
export function getFilledLineCells(
  board: CellValue[],
  indices: number[],
): TileValue[] {
  return getLineCells(board, indices);
}

export function getScoringLines(
  perspective: Perspective,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): ScoringLine[] {
  const size = config.boardSize;
  const lines: ScoringLine[] = [];
  if (perspective === "rows") {
    for (let r = 0; r < size; r++) {
      lines.push({
        id: `row-${r}`,
        label: `Row ${r + 1}`,
        indices: rowIndices(r, size),
      });
    }
    for (const d of rowMinusColDiagonals(config)) {
      lines.push({
        id: d.id,
        label: d.label,
        indices: indicesWithRowMinusCol(d.k, size),
      });
    }
  } else {
    for (let c = 0; c < size; c++) {
      lines.push({
        id: `col-${c}`,
        label: `Column ${c + 1}`,
        indices: colIndices(c, size),
      });
    }
    for (const d of rowPlusColDiagonals(config)) {
      lines.push({
        id: d.id,
        label: d.label,
        indices: indicesWithRowPlusCol(d.k, size),
      });
    }
  }
  return lines;
}

export function indexToRowCol(
  index: number,
  boardSize = BOARD_SIZE,
): { row: number; col: number } {
  const cellCount = boardSize * boardSize;
  if (index < 0 || index >= cellCount) {
    throw new RangeError(`Invalid index ${index}`);
  }
  return { row: Math.floor(index / boardSize), col: index % boardSize };
}

export function rowColToIndex(row: number, col: number, boardSize = BOARD_SIZE): number {
  return row * boardSize + col;
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
