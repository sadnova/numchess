import {
  searchBestMove,
  type CompoundMove,
  type GameState,
  type PlayerId,
} from "@numchess/engine";

export type BotWorkerRequest = {
  id: number;
  state: GameState;
  player: PlayerId;
  timeMs: number;
  easyNoise?: boolean;
};

export type BotWorkerResponse = {
  id: number;
  move: CompoundMove | null;
};

self.onmessage = (event: MessageEvent<BotWorkerRequest>) => {
  const { id, state, player, timeMs, easyNoise } = event.data;
  const move = searchBestMove(state, player, {
    timeMs,
    maxDepth: 5,
    easyNoise,
  });
  const response: BotWorkerResponse = { id, move };
  self.postMessage(response);
};
