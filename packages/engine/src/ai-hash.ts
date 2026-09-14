import { tileValuesFor } from "./config.js";
import type { GameState } from "./types.js";

/** 64-bit hash for transposition table (not cryptographically secure). */
export function hashGameState(state: GameState): bigint {
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < state.board.length; i++) {
    const c = state.board[i];
    h ^= BigInt(c === null ? 0 : c);
    h = (h * prime) & 0xffffffffffffffffn;
  }
  const tiles = tileValuesFor(state.config);
  for (let p = 0; p < 2; p++) {
    const inv = state.inventories[p]!.counts;
    for (const v of tiles) {
      h ^= BigInt(inv[v]);
      h = (h * prime) & 0xffffffffffffffffn;
    }
  }
  if (state.phase.kind === "select") {
    h ^= BigInt(1 + state.phase.player);
  } else if (state.phase.kind === "place") {
    h ^= BigInt(10 + state.phase.player * 2 + state.phase.selected);
  } else {
    h ^= 100n;
  }
  h = (h * prime) & 0xffffffffffffffffn;
  return h;
}
