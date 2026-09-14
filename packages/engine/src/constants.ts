export const RULES_VERSION = "1.1.0";

export const BOARD_SIZE = 6;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

export type TileValue = 1 | 2 | 3 | 4 | 5;

export const TILE_VALUES: TileValue[] = [1, 2, 3, 4, 5];

export const STARTING_INVENTORY: Record<TileValue, number> = {
  1: 3,
  2: 4,
  3: 4,
  4: 4,
  5: 3,
};

export const GLOBAL_BOARD_TOTALS: Record<TileValue, number> = {
  1: 6,
  2: 8,
  3: 8,
  4: 8,
  5: 6,
};

export type GameVariant = "classic" | "classic-reserve";

export interface GameConfig {
  variant: GameVariant;
  rulesVersion: string;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  variant: "classic",
  rulesVersion: RULES_VERSION,
};
