export const RULES_VERSION = "1.2.0";
export const RULES_VERSION_STRATEGIC = "2.0.0";

/** @deprecated use boardSize(state.config) or config.boardSize */
export const BOARD_SIZE = 6;
/** @deprecated use cellCount(state.config) */
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

export type TileValue = 1 | 2 | 3 | 4 | 5 | 6;

export const TILE_VALUES: TileValue[] = [1, 2, 3, 4, 5];

export const STARTING_INVENTORY: Record<TileValue, number> = {
  1: 3,
  2: 4,
  3: 4,
  4: 4,
  5: 3,
  6: 0,
};

export const STRATEGIC_STARTING_INVENTORY: Record<TileValue, number> = {
  1: 4,
  2: 5,
  3: 6,
  4: 6,
  5: 5,
  6: 6,
};

export const GLOBAL_BOARD_TOTALS: Record<TileValue, number> = {
  1: 6,
  2: 8,
  3: 8,
  4: 8,
  5: 6,
  6: 0,
};

export type GameVariant = "classic" | "classic-reserve";
export type BoardMode = "classic" | "strategic";

export interface ScoringProfile {
  minR: 2 | 3;
  minD: 2 | 3;
  cap: 5 | 6;
  tiebreakLevels: readonly (2 | 3 | 4 | 5 | 6)[];
  celebrationLevels?: readonly number[];
}

export interface GameConfig {
  boardMode: BoardMode;
  variant: GameVariant;
  rulesVersion: string;
  boardSize: number;
  scoring: ScoringProfile;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  boardMode: "classic",
  variant: "classic",
  rulesVersion: RULES_VERSION,
  boardSize: BOARD_SIZE,
  scoring: {
    minR: 2,
    minD: 2,
    cap: 5,
    tiebreakLevels: [5, 4, 3, 2],
    celebrationLevels: [4, 5],
  },
};
