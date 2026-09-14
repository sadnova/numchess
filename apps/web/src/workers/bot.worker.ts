import {
  chooseBotMove,
  getLegalCompoundMoves,
  type CompoundMove,
  type GameState,
  type PlayerId,
  type SearchOptions,
} from "@numchess/engine";

export type BotWorkerRequest = {
  id: number;
  state: GameState;
  player: PlayerId;
  options: SearchOptions;
};

export type BotWorkerResponse = {
  id: number;
  move: CompoundMove | null;
  ok: boolean;
  error?: string;
  usedFallback?: boolean;
};

function guaranteedMove(
  state: GameState,
  player: PlayerId,
  options: SearchOptions,
): { move: CompoundMove | null; usedFallback: boolean } {
  const move = chooseBotMove(state, player, options);
  if (move) return { move, usedFallback: false };

  const moves = getLegalCompoundMoves(state);
  if (moves.length > 0) {
    return { move: moves[0] ?? null, usedFallback: true };
  }
  return { move: null, usedFallback: true };
}

self.onmessage = (event: MessageEvent<BotWorkerRequest>) => {
  const id = event.data?.id ?? -1;
  try {
    const { state, player, options } = event.data;
    const { move, usedFallback } = guaranteedMove(
      state,
      player,
      options ?? {},
    );
    const response: BotWorkerResponse = {
      id,
      move,
      ok: move !== null,
      usedFallback,
    };
    self.postMessage(response);
  } catch (err) {
    try {
      const { state, player } = event.data;
      const moves = getLegalCompoundMoves(state);
      const move = moves[0] ?? null;
      self.postMessage({
        id,
        move,
        ok: move !== null,
        usedFallback: true,
        error: err instanceof Error ? err.message : String(err),
      });
    } catch (innerErr) {
      self.postMessage({
        id,
        move: null,
        ok: false,
        error: innerErr instanceof Error ? innerErr.message : String(innerErr),
      });
    }
  }
};
