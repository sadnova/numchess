import {
  RULES_VERSION,
  applyAction,
  createInitialState,
  evaluateGame,
  resolveWinner,
  type GameState,
} from "@numchess/engine";
import {
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
    config: state.config,
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
  let s = createInitialState(file.config);
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
    const state = stateFromReplay(safe.data);
    if (!state) {
      return { ok: false, error: "Replay actions could not be applied" };
    }
    let warning: string | undefined;
    if (safe.data.rulesVersion !== RULES_VERSION) {
      warning = `Rules version ${safe.data.rulesVersion} differs from app ${RULES_VERSION}`;
    }
    if (state.board.every((c) => c !== null)) {
      const { levels, ledger } = evaluateGame(state);
      resolveWinner(levels, ledger);
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
