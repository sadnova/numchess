import { useEffect, useRef, useState } from "react";
import {
  getLegalCompoundMoves,
  type PlayerId,
} from "@numchess/engine";
import type { BotDifficulty, HumanSeat } from "../lib/persistence";
import { botSearchOptions } from "../lib/persistence";
import { botSeatFor } from "../lib/playVsBot";
import { useGameStore } from "../store/gameStore";
import BotWorker from "../workers/bot.worker?worker";
import type { BotWorkerRequest, BotWorkerResponse } from "../workers/bot.worker";

function tryApplyAnyBotMove(
  applyBotCompoundMove: (move: import("@numchess/engine").CompoundMove) => boolean,
): boolean {
  const moves = getLegalCompoundMoves(useGameStore.getState().state);
  for (const move of moves) {
    if (applyBotCompoundMove(move)) return true;
  }
  return false;
}

export function useBotPlayer(
  mode: "local2p" | "vsBot" | "sandbox",
  difficulty: BotDifficulty,
  humanSeat: HumanSeat,
) {
  const ply = useGameStore((s) => s.state.ply);
  const phaseKind = useGameStore((s) => s.state.phase.kind);
  const phasePlayer = useGameStore((s) => {
    const p = s.state.phase;
    return p.kind === "ended" ? null : p.player;
  });
  const applyBotCompoundMove = useGameStore((s) => s.applyBotCompoundMove);

  const workerRef = useRef<Worker | null>(null);
  const reqId = useRef(0);
  const busy = useRef(false);

  const [botThinking, setBotThinking] = useState(false);

  const botSeat: PlayerId = botSeatFor(humanSeat);

  useEffect(() => {
    if (mode !== "vsBot") {
      setBotThinking(false);
      busy.current = false;
      workerRef.current?.terminate();
      workerRef.current = null;
      return;
    }
    workerRef.current = new BotWorker();
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      busy.current = false;
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "vsBot") return;
    if (phaseKind === "ended") {
      setBotThinking(false);
      return;
    }
    if (phasePlayer !== botSeat) return;
    if (busy.current) return;

    const worker = workerRef.current;
    if (!worker) return;

    const finishThinking = () => {
      busy.current = false;
      setBotThinking(false);
    };

    const applyMoveFromWorker = (data: BotWorkerResponse) => {
      const current = useGameStore.getState().state;
      if (
        current.phase.kind === "ended" ||
        (current.phase.kind !== "ended" && current.phase.player !== botSeat)
      ) {
        finishThinking();
        return;
      }

      if (data.move && applyBotCompoundMove(data.move)) {
        finishThinking();
        return;
      }

      if (tryApplyAnyBotMove(applyBotCompoundMove)) {
        finishThinking();
        return;
      }

      finishThinking();
      console.warn("Bot could not apply a move; no legal moves?");
    };

    busy.current = true;
    setBotThinking(true);
    const id = ++reqId.current;
    const state = useGameStore.getState().state;

    const onMessage = (event: MessageEvent<BotWorkerResponse>) => {
      if (event.data.id !== id) return;
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      applyMoveFromWorker(event.data);
    };

    const onError = () => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      if (tryApplyAnyBotMove(applyBotCompoundMove)) {
        finishThinking();
        return;
      }
      finishThinking();
      console.error("Bot worker error; could not find legal move");
    };

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.postMessage({
      id,
      state,
      player: botSeat,
      options: botSearchOptions(difficulty),
    } satisfies BotWorkerRequest);
  }, [
    mode,
    difficulty,
    humanSeat,
    botSeat,
    ply,
    phaseKind,
    phasePlayer,
    applyBotCompoundMove,
  ]);

  return { botThinking, botSeat, humanSeat };
}
