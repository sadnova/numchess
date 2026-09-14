import {
  configForBoardMode,
  normalizeGameConfig,
  searchOptionsForDifficulty,
  type BoardMode,
  type GameConfig,
  type GameState,
  type SearchOptions,
} from "@numchess/engine";

const RESUME_KEY = "numchess-resume";
const SETTINGS_KEY = "numchess-settings";

const GAME_MODES = ["local2p", "vsBot", "botSpectator", "sandbox"] as const;
export type GameMode = (typeof GAME_MODES)[number];

function parseGameMode(value: unknown): GameMode {
  if (typeof value === "string" && (GAME_MODES as readonly string[]).includes(value)) {
    return value as GameMode;
  }
  return "local2p";
}

export type BotDifficulty = "easy" | "medium" | "hard";

export type { BoardMode };

function parseBoardMode(value: unknown): BoardMode {
  return value === "strategic" ? "strategic" : "classic";
}

export type HumanSeat = 1 | 2;

export interface AppSettings {
  boardMode: BoardMode;
  showRowOverlays: boolean;
  showColOverlays: boolean;
  showDiagOverlays: boolean;
  gameMode: GameMode;
  botDifficulty: BotDifficulty;
  botP1Difficulty: BotDifficulty;
  botP2Difficulty: BotDifficulty;
  spectatorAutoPlay: boolean;
  spectatorPaceMs: number;
  humanSeat: HumanSeat;
  muteSound: boolean;
  sfxVolume: number;
  sfxLineLock: boolean;
  sfxLevelFanfare: boolean;
  sfxCelebration: boolean;
  reduceMotion: boolean;
  randomFirstPlayer: boolean;
  openingSwap: boolean;
  /** Alternates first player each new game when openingSwap is on. */
  _nextFirstPlayer: 1 | 2;
  arenaClockEnabled: boolean;
  arenaMoveLimitSec: number;
  showTutorialOnPlay: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  boardMode: "classic",
  showRowOverlays: true,
  showColOverlays: true,
  showDiagOverlays: true,
  gameMode: "local2p",
  botDifficulty: "medium",
  botP1Difficulty: "hard",
  botP2Difficulty: "medium",
  spectatorAutoPlay: true,
  spectatorPaceMs: 400,
  humanSeat: 1,
  muteSound: false,
  sfxVolume: 0.7,
  sfxLineLock: true,
  sfxLevelFanfare: true,
  sfxCelebration: false,
  reduceMotion: false,
  randomFirstPlayer: false,
  openingSwap: false,
  _nextFirstPlayer: 1,
  arenaClockEnabled: false,
  arenaMoveLimitSec: 120,
  showTutorialOnPlay: true,
};

export function botTimeMs(difficulty: BotDifficulty): number {
  return botSearchOptions(difficulty).timeMs ?? 800;
}

export function botSearchOptions(
  difficulty: BotDifficulty,
  boardMode: BoardMode = "classic",
): SearchOptions {
  return searchOptionsForDifficulty(difficulty, boardMode);
}

export function isAppSettings(value: unknown): value is AppSettings {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<AppSettings>;
  return (
    typeof v.gameMode === "string" &&
    (GAME_MODES as readonly string[]).includes(v.gameMode) &&
    (v.boardMode === "classic" || v.boardMode === "strategic")
  );
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      gameMode: parseGameMode(parsed.gameMode),
      boardMode: parseBoardMode(parsed.boardMode),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function resolveFirstPlayer(settings: AppSettings): {
  first: 1 | 2;
  settingsPatch: Partial<AppSettings>;
} {
  if (settings.randomFirstPlayer) {
    const first = Math.random() < 0.5 ? 1 : 2;
    return { first, settingsPatch: {} };
  }
  if (settings.openingSwap) {
    const first = settings._nextFirstPlayer;
    const next = first === 1 ? 2 : 1;
    return { first, settingsPatch: { _nextFirstPlayer: next } };
  }
  return { first: 1, settingsPatch: {} };
}

export function gameConfigForSettings(settings: AppSettings): GameConfig {
  return configForBoardMode(settings.boardMode);
}

export function loadResumeGame(): GameState | null {
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed?.board || parsed.phase?.kind === "ended") return null;
    const config = normalizeGameConfig(parsed.config ?? {});
    if (parsed.board.length !== config.boardSize * config.boardSize) return null;
    return { ...parsed, config };
  } catch {
    return null;
  }
}

/** Drop resume when it does not match current settings board mode. */
export function resumeMatchesSettings(
  state: GameState,
  settings: AppSettings,
): boolean {
  const config = normalizeGameConfig(state.config);
  return config.boardMode === settings.boardMode;
}

export function saveResumeGame(state: GameState): void {
  if (state.phase.kind === "ended") {
    localStorage.removeItem(RESUME_KEY);
    return;
  }
  localStorage.setItem(RESUME_KEY, JSON.stringify(state));
}

export function clearResumeGame(): void {
  localStorage.removeItem(RESUME_KEY);
}

export function isSandboxMode(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("sandbox") === "1" || params.get("mode") === "sandbox";
}
