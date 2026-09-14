import { applyCompoundMove } from "./ai.js";
import type { GameConfig, TileValue } from "./constants.js";
import { DEFAULT_GAME_CONFIG } from "./constants.js";
import { createInitialState } from "./state.js";
import type { GameState } from "./types.js";

/** Dev sandbox: mid-game board with several tiles placed. */
export function createSandboxState(): GameState {
  let s = createInitialState();
  const moves: { select: TileValue; place: number }[] = [
    { select: 3, place: 0 },
    { select: 4, place: 6 },
    { select: 2, place: 1 },
    { select: 5, place: 7 },
    { select: 1, place: 2 },
    { select: 3, place: 8 },
  ];
  for (const m of moves) {
    const next = applyCompoundMove(s, m);
    if (!next) break;
    s = next;
  }
  return s;
}

export function createInitialStateWithFirstPlayer(
  player: 1 | 2,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): GameState {
  const s = createInitialState(config);
  if (player === 2) {
    return { ...s, phase: { kind: "select", player: 2 } };
  }
  return s;
}
