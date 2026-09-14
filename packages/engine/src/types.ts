import type { TileValue } from "./constants.js";

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export type IllegalMoveReason =
  | "NOT_YOUR_TURN"
  | "WRONG_PHASE"
  | "INVALID_TILE"
  | "TILE_UNAVAILABLE"
  | "CELL_OCCUPIED"
  | "CELL_EMPTY"
  | "GAME_ENDED"
  | "INVALID_INDEX";

export type PlayerId = 1 | 2;

export type CellValue = TileValue | null;

export interface Inventory {
  counts: Record<TileValue, number>;
}

export type LevelCounts = Record<2 | 3 | 4 | 5, number>;

export interface LevelCountsPair {
  rows: LevelCounts;
  columns: LevelCounts;
}

export interface LineContribution {
  level: 2 | 3 | 4 | 5;
  kind: "repetition" | "diversity";
}

export interface LineAnalysis {
  cells: TileValue[];
  R: number;
  D: number;
  contributions: LineContribution[];
}

export interface LineLedgerEntry {
  id: string;
  label: string;
  indices: number[];
  analysis: LineAnalysis;
}

export type GameResult =
  | {
      outcome: "win";
      winner: PlayerId;
      decisiveLevel: 2 | 3 | 4 | 5;
      levels: LevelCountsPair;
      ledger: { player1: LineLedgerEntry[]; player2: LineLedgerEntry[] };
    }
  | {
      outcome: "draw";
      levels: LevelCountsPair;
      ledger: { player1: LineLedgerEntry[]; player2: LineLedgerEntry[] };
    };

export type Phase =
  | { kind: "select"; player: PlayerId }
  | { kind: "place"; player: PlayerId; selected: TileValue }
  | { kind: "ended"; result: GameResult };

export type GameAction =
  | { type: "SELECT"; value: TileValue }
  | { type: "PLACE"; index: number }
  | { type: "RESERVE_HOLD" }
  | { type: "RESERVE_PLAY"; index: number };

export interface GameState {
  board: CellValue[];
  inventories: [Inventory, Inventory];
  phase: Phase;
  ply: number;
  history: GameAction[];
  config: import("./constants.js").GameConfig;
}

export type Perspective = "rows" | "columns";

export type LegalAction =
  | { type: "SELECT"; value: TileValue }
  | { type: "PLACE"; index: number };
