import {
  DEFAULT_GAME_CONFIG,
  RULES_VERSION,
  RULES_VERSION_STRATEGIC,
  STARTING_INVENTORY,
  STRATEGIC_STARTING_INVENTORY,
  type BoardMode,
  type GameConfig,
  type GameVariant,
  type ScoringProfile,
  type TileValue,
} from "./constants.js";
import type { LevelCounts } from "./types.js";

export const CLASSIC_SCORING: ScoringProfile = {
  minR: 2,
  minD: 2,
  cap: 5,
  tiebreakLevels: [5, 4, 3, 2],
  celebrationLevels: [4, 5],
};

export const STRATEGIC_SCORING: ScoringProfile = {
  minR: 3,
  minD: 3,
  cap: 6,
  tiebreakLevels: [6, 5, 4, 3],
  celebrationLevels: [5, 6],
};

export function boardSize(config: GameConfig): number {
  return config.boardSize;
}

export function cellCount(config: GameConfig): number {
  return config.boardSize * config.boardSize;
}

export function tileValuesFor(config: GameConfig): TileValue[] {
  if (config.boardMode === "strategic") {
    return [1, 2, 3, 4, 5, 6];
  }
  return [1, 2, 3, 4, 5];
}

export function inventoryFor(config: GameConfig): Record<TileValue, number> {
  if (config.boardMode === "strategic") {
    return { ...STRATEGIC_STARTING_INVENTORY };
  }
  return { ...STARTING_INVENTORY };
}

export function emptyLevelCounts(_config?: GameConfig): LevelCounts {
  return { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
}

export function configForBoardMode(
  boardMode: BoardMode,
  options?: { variant?: GameVariant },
): GameConfig {
  const variant = options?.variant ?? "classic";
  if (boardMode === "strategic") {
    return {
      boardMode: "strategic",
      variant,
      rulesVersion: RULES_VERSION_STRATEGIC,
      boardSize: 8,
      scoring: STRATEGIC_SCORING,
    };
  }
  return {
    boardMode: "classic",
    variant,
    rulesVersion: RULES_VERSION,
    boardSize: 6,
    scoring: CLASSIC_SCORING,
  };
}

/** Merge persisted / replay config with mode defaults (legacy JSON without boardMode). */
export function normalizeGameConfig(input: Partial<GameConfig>): GameConfig {
  const inferredMode: BoardMode =
    input.boardMode ??
    (input.rulesVersion === RULES_VERSION_STRATEGIC ? "strategic" : "classic");
  const base = configForBoardMode(inferredMode, {
    variant: input.variant ?? "classic",
  });
  return {
    ...base,
    ...input,
    boardMode: input.boardMode ?? base.boardMode,
    boardSize: input.boardSize ?? base.boardSize,
    rulesVersion: input.rulesVersion ?? base.rulesVersion,
    scoring: {
      ...base.scoring,
      ...input.scoring,
    },
  };
}

export function getGameConfigForRulesVersion(
  rulesVersion: string,
): GameConfig | null {
  if (rulesVersion === RULES_VERSION) {
    return configForBoardMode("classic");
  }
  if (rulesVersion === RULES_VERSION_STRATEGIC) {
    return configForBoardMode("strategic");
  }
  return null;
}

export { DEFAULT_GAME_CONFIG };
