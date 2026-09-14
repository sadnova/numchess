import { create } from "zustand";
import {
  applyAction,
  applyCompoundMove,
  cancelSelection,
  createInitialState,
  createInitialStateWithFirstPlayer,
  getLegalActions,
  normalizeGameConfig,
  type CompoundMove,
  type GameAction,
  type GameConfig,
  type GameState,
  type TileValue,
} from "@numchess/engine";
import {
  clearResumeGame,
  gameConfigForSettings,
  loadResumeGame,
  loadSettings,
  resumeMatchesSettings,
  saveResumeGame,
} from "../lib/persistence";

const MAX_UNDO = 40;

const settingsOnBoot = loadSettings();
const rawResume = loadResumeGame();
const resumed =
  rawResume && resumeMatchesSettings(rawResume, settingsOnBoot)
    ? rawResume
    : null;
if (rawResume && !resumed) {
  clearResumeGame();
}
export const startedFromResume = resumed !== null;

interface GameStore {
  state: GameState;
  undoStack: GameState[];
  selectedTile: TileValue | null;
  dispatch: (action: GameAction) => void;
  selectTile: (value: TileValue) => void;
  placeAt: (index: number) => void;
  cancelSelect: () => void;
  undo: () => void;
  newGame: (options?: {
    firstPlayer?: 1 | 2;
    initialState?: GameState;
    config?: GameConfig;
  }) => void;
  loadState: (state: GameState) => void;
  applyBotCompoundMove: (move: CompoundMove) => boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state:
    resumed ?? createInitialState(gameConfigForSettings(settingsOnBoot)),
  undoStack: [],
  selectedTile: null,

  dispatch: (action) => {
    const prev = get().state;
    const result = applyAction(prev, action);
    if (!result.ok) return;
    const next = result.value;
    set({
      state: next,
      undoStack: [...get().undoStack.slice(-MAX_UNDO), prev],
      selectedTile:
        next.phase.kind === "place" ? next.phase.selected : null,
    });
  },

  selectTile: (value) => {
    get().dispatch({ type: "SELECT", value });
  },

  placeAt: (index) => {
    get().dispatch({ type: "PLACE", index });
  },

  cancelSelect: () => {
    const result = cancelSelection(get().state);
    if (!result.ok) return;
    set({ state: result.value, selectedTile: null });
  },

  undo: () => {
    const stack = get().undoStack;
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1]!;
    set({
      state: prev,
      undoStack: stack.slice(0, -1),
      selectedTile: prev.phase.kind === "place" ? prev.phase.selected : null,
    });
  },

  newGame: (options?: {
    firstPlayer?: 1 | 2;
    initialState?: GameState;
    config?: GameConfig;
  }) => {
    clearResumeGame();
    const config = normalizeGameConfig(
      options?.initialState?.config ??
        options?.config ??
        gameConfigForSettings(loadSettings()),
    );
    let state =
      options?.initialState ?? createInitialState(config);
    if (!options?.initialState && options?.firstPlayer === 2) {
      state = createInitialStateWithFirstPlayer(2, config);
    }
    set({
      state,
      undoStack: [],
      selectedTile: null,
    });
  },

  loadState: (state) =>
    set({
      state,
      undoStack: [],
      selectedTile: state.phase.kind === "place" ? state.phase.selected : null,
    }),

  applyBotCompoundMove: (move) => {
    const prev = get().state;
    if (prev.phase.kind === "ended") return false;
    const next = applyCompoundMove(prev, move);
    if (!next) return false;
    set({
      state: next,
      undoStack: [...get().undoStack.slice(-MAX_UNDO), prev],
      selectedTile: null,
    });
    return true;
  },
}));

useGameStore.subscribe((s) => {
  saveResumeGame(s.state);
});

export function canSelectTile(state: GameState, value: TileValue): boolean {
  return getLegalActions(state).some(
    (a) => a.type === "SELECT" && a.value === value,
  );
}

export function legalPlaceIndices(state: GameState): number[] {
  return getLegalActions(state)
    .filter((a) => a.type === "PLACE")
    .map((a) => a.index);
}
