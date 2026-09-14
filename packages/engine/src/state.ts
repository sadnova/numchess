import {
  CELL_COUNT,
  DEFAULT_GAME_CONFIG,
  STARTING_INVENTORY,
  type GameConfig,
  type TileValue,
} from "./constants.js";
import { evaluateGame } from "./scoring.js";
import { resolveWinner } from "./winner.js";
import type {
  CellValue,
  GameAction,
  GameState,
  IllegalMoveReason,
  Inventory,
  LegalAction,
  PlayerId,
  Result,
} from "./types.js";
import { err, ok } from "./types.js";

function cloneInventory(): Inventory {
  return { counts: { ...STARTING_INVENTORY } };
}

function emptyBoard(): CellValue[] {
  return Array.from({ length: CELL_COUNT }, () => null);
}

function playerIndex(player: PlayerId): 0 | 1 {
  return player === 1 ? 0 : 1;
}

function activePlayer(state: GameState): PlayerId {
  if (state.phase.kind === "ended") {
    throw new Error("No active player");
  }
  return state.phase.player;
}

export function createInitialState(
  config: GameConfig = DEFAULT_GAME_CONFIG,
): GameState {
  return {
    board: emptyBoard(),
    inventories: [cloneInventory(), cloneInventory()],
    phase: { kind: "select", player: 1 },
    ply: 0,
    history: [],
    config,
  };
}

export function getLegalActions(state: GameState): LegalAction[] {
  if (state.phase.kind === "ended") return [];

  const player = state.phase.player;
  const inv = state.inventories[playerIndex(player)];

  if (state.phase.kind === "select") {
    const actions: LegalAction[] = [];
    for (const value of [1, 2, 3, 4, 5] as TileValue[]) {
      if (inv.counts[value] > 0) {
        actions.push({ type: "SELECT", value });
      }
    }
    return actions;
  }

  const actions: LegalAction[] = [];
  for (let i = 0; i < CELL_COUNT; i++) {
    if (state.board[i] === null) {
      actions.push({ type: "PLACE", index: i });
    }
  }
  return actions;
}

function finalizeIfFull(state: GameState): GameState {
  if (!state.board.every((c) => c !== null)) {
    return state;
  }
  const { levels, ledger } = evaluateGame(state);
  const result = resolveWinner(levels, ledger);
  return {
    ...state,
    phase: { kind: "ended", result },
  };
}

export function applyAction(
  state: GameState,
  action: GameAction,
): Result<GameState, IllegalMoveReason> {
  if (state.phase.kind === "ended") {
    return err("GAME_ENDED");
  }

  const player = state.phase.player;

  if (action.type === "SELECT") {
    if (state.phase.kind !== "select") return err("WRONG_PHASE");
    const inv = state.inventories[playerIndex(player)];
    if (inv.counts[action.value] <= 0) return err("TILE_UNAVAILABLE");
    const next: GameState = {
      ...state,
      phase: { kind: "place", player, selected: action.value },
      history: [...state.history, action],
    };
    return ok(next);
  }

  if (action.type === "PLACE") {
    if (state.phase.kind !== "place") return err("WRONG_PHASE");
    if (action.index < 0 || action.index >= CELL_COUNT) {
      return err("INVALID_INDEX");
    }
    if (state.board[action.index] !== null) return err("CELL_OCCUPIED");

    const selected = state.phase.selected;
    const board = [...state.board];
    board[action.index] = selected;

    const inventories = [
      { counts: { ...state.inventories[0].counts } },
      { counts: { ...state.inventories[1].counts } },
    ] as [Inventory, Inventory];
    inventories[playerIndex(player)].counts[selected] -= 1;

    const nextPlayer: PlayerId = player === 1 ? 2 : 1;
    const ply = state.ply + 1;

    let next: GameState = {
      ...state,
      board,
      inventories,
      ply,
      history: [...state.history, action],
      phase: { kind: "select", player: nextPlayer },
    };

    if (ply >= CELL_COUNT) {
      next = finalizeIfFull(next);
    }

    return ok(next);
  }

  if (action.type === "RESERVE_HOLD" || action.type === "RESERVE_PLAY") {
    return err("WRONG_PHASE");
  }

  return err("INVALID_TILE");
}

export function applyActionOrThrow(
  state: GameState,
  action: GameAction,
): GameState {
  const result = applyAction(state, action);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.value;
}

export function currentPlayer(state: GameState): PlayerId | null {
  if (state.phase.kind === "ended") return null;
  return state.phase.player;
}
