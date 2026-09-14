import {
  RULES_VERSION,
  RULES_VERSION_STRATEGIC,
  applyAction,
  createInitialState,
  evaluateGame,
  normalizeGameConfig,
  resolveWinner,
  type GameState,
} from "@numchess/engine";
import {
  SUPPORTED_RULES_VERSIONS,
  parseReplayFileSafe,
  type ReplayFile,
} from "@numchess/replay";

export const MAX_REPLAY_BYTES = 256 * 1024;

function playerForActionIndex(index: number): import("@numchess/engine").PlayerId {
  const turn = Math.floor(index / 2);
  return turn % 2 === 0 ? 1 : 2;
}

export function buildReplayFromState(state: GameState): ReplayFile {
  const actions: ReplayFile["actions"] = state.history.map((action, i) => ({
    ply: Math.floor(i / 2) + 1,
    player: playerForActionIndex(i),
    action,
  }));
  return {
    schema: "numchess-replay/v1",
    rulesVersion: state.config.rulesVersion,
    config: {
      boardMode: state.config.boardMode,
      variant: state.config.variant,
      rulesVersion: state.config.rulesVersion,
      boardSize: state.config.boardSize,
    },
    actions,
    meta: {
      createdAt: new Date().toISOString(),
      appVersion: "0.1.0",
    },
  };
}

export function stateAtReplayStep(
  file: ReplayFile,
  actionCount: number,
): GameState | null {
  const config = normalizeGameConfig(file.config);
  let s = createInitialState(config);
  const n = Math.max(0, Math.min(actionCount, file.actions.length));
  for (let i = 0; i < n; i++) {
    const entry = file.actions[i];
    if (!entry) break;
    const result = applyAction(s, entry.action);
    if (!result.ok) return null;
    s = result.value;
  }
  return s;
}

export function stateFromReplay(file: ReplayFile): GameState | null {
  return stateAtReplayStep(file, file.actions.length);
}

export type ImportReplayResult =
  | { ok: true; state: GameState; warning?: string }
  | { ok: false; error: string };

function rulesVersionSupported(v: string): boolean {
  return (SUPPORTED_RULES_VERSIONS as readonly string[]).includes(v);
}

export function importReplayJson(raw: string): ImportReplayResult {
  if (raw.length > MAX_REPLAY_BYTES) {
    return { ok: false, error: "Replay file too large (max 256KB)" };
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    const safe = parseReplayFileSafe(parsed);
    if (!safe.success) {
      return { ok: false, error: "Invalid replay schema" };
    }
    if (!rulesVersionSupported(safe.data.rulesVersion)) {
      return {
        ok: false,
        error: `Unsupported rules version ${safe.data.rulesVersion}`,
      };
    }
    const state = stateFromReplay(safe.data);
    if (!state) {
      return { ok: false, error: "Replay actions could not be applied" };
    }
    let warning: string | undefined;
    const appClassic = RULES_VERSION;
    const appStrategic = RULES_VERSION_STRATEGIC;
    if (
      safe.data.rulesVersion !== appClassic &&
      safe.data.rulesVersion !== appStrategic
    ) {
      warning = `Rules version ${safe.data.rulesVersion} differs from app`;
    }
    if (state.board.every((c) => c !== null)) {
      const { levels, ledger } = evaluateGame(state);
      resolveWinner(levels, ledger, state.config);
    }
    return { ok: true, state, warning };
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
}

/** @deprecated use importReplayJson result object */
export function importReplayJsonLegacy(raw: string): GameState | null {
  const r = importReplayJson(raw);
  return r.ok ? r.state : null;
}

export function exportReplayJson(state: GameState): string {
  return JSON.stringify(buildReplayFromState(state), null, 2);
}
