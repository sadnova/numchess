import { useEffect, useRef } from "react";
import type { PlayerId } from "@numchess/engine";
import type { BotDifficulty, HumanSeat } from "../lib/persistence";
import { botTimeMs } from "../lib/persistence";
import { useGameStore } from "../store/gameStore";
import BotWorker from "../workers/bot.worker?worker";
import type { BotWorkerRequest, BotWorkerResponse } from "../workers/bot.worker";

export function useBotPlayer(
  mode: "local2p" | "vsBot" | "sandbox",
  difficulty: BotDifficulty,
  humanSeat: HumanSeat,
) {
  const phase = useGameStore((s) => s.state.phase);
  const selectTile = useGameStore((s) => s.selectTile);
  const placeAt = useGameStore((s) => s.placeAt);
  const workerRef = useRef<Worker | null>(null);
  const reqId = useRef(0);
  const busy = useRef(false);

  const botSeat: PlayerId = humanSeat === 1 ? 2 : 1;

  useEffect(() => {
    if (mode !== "vsBot") return;
    workerRef.current = new BotWorker();
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "vsBot") return;
    if (phase.kind === "ended") return;
    if (phase.player !== botSeat) return;
    if (busy.current) return;

    const worker = workerRef.current;
    if (!worker) return;

    busy.current = true;
    const id = ++reqId.current;
    const state = useGameStore.getState().state;
    const timeMs = botTimeMs(difficulty);

    const onMessage = (event: MessageEvent<BotWorkerResponse>) => {
      if (event.data.id !== id) return;
      worker.removeEventListener("message", onMessage);
      busy.current = false;
      const move = event.data.move;
      if (!move) return;
      selectTile(move.select);
      placeAt(move.place);
    };

    worker.addEventListener("message", onMessage);
    const req: BotWorkerRequest = {
      id,
      state,
      player: botSeat,
      timeMs,
      easyNoise: difficulty === "easy",
    };
    worker.postMessage(req);
  }, [mode, difficulty, humanSeat, botSeat, phase, selectTile, placeAt]);
}
