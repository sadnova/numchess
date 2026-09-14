import {
  searchOptionsForDifficulty,
  type GameState,
  type SearchOptions,
} from "@numchess/engine";

const RESUME_KEY = "numchess-resume";
const SETTINGS_KEY = "numchess-settings";

export type GameMode = "local2p" | "vsBot" | "sandbox";

export type BotDifficulty = "easy" | "medium" | "hard";

export type HumanSeat = 1 | 2;

export interface AppSettings {
  showRowOverlays: boolean;
  showColOverlays: boolean;
  showDiagOverlays: boolean;
  gameMode: GameMode;
  botDifficulty: BotDifficulty;
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
  showRowOverlays: true,
  showColOverlays: true,
  showDiagOverlays: true,
  gameMode: "local2p",
  botDifficulty: "medium",
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

export function botSearchOptions(difficulty: BotDifficulty): SearchOptions {
  return searchOptionsForDifficulty(difficulty);
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
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

export function loadResumeGame(): GameState | null {
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed?.board || parsed.phase?.kind === "ended") return null;
    return parsed;
  } catch {
    return null;
  }
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
