import { useEffect, useRef, useState, type RefObject } from "react";
import {
  getLegalCompoundMoves,
  type PlayerId,
} from "@numchess/engine";
import type { BotDifficulty, HumanSeat } from "../lib/persistence";
import { botSearchOptions } from "../lib/persistence";
import { botSeatFor } from "../lib/playVsBot";
import {
  VS_BOT_CELEBRATION_CAP_MS,
} from "../lib/spectatorTiming";
import { useGameStore } from "../store/gameStore";
import BotWorker from "../workers/bot.worker?worker";
import type { BotWorkerRequest, BotWorkerResponse } from "../workers/bot.worker";

export type BotUiStatus = "idle" | "thinking" | "retrying" | "failed";

const MAX_BOT_RETRIES = 3;

export type BotPlayerConfig =
  | { automation: "off" }
  | {
      automation: "vsBot";
      difficulty: BotDifficulty;
      humanSeat: HumanSeat;
      celebrationHoldMsRef: RefObject<number>;
    }
  | {
      automation: "spectator";
      p1Difficulty: BotDifficulty;
      p2Difficulty: BotDifficulty;
      autoPlay: boolean;
      paceMs: number;
      celebrationHoldMsRef: RefObject<number>;
    };

function tryApplyAnyBotMove(
  applyBotCompoundMove: (move: import("@numchess/engine").CompoundMove) => boolean,
): boolean {
  const moves = getLegalCompoundMoves(useGameStore.getState().state);
  for (const move of moves) {
    if (applyBotCompoundMove(move)) return true;
  }
  return false;
}

function isAutomatedSeat(
  config: BotPlayerConfig,
  player: PlayerId,
  humanSeat: HumanSeat,
): boolean {
  if (config.automation === "off") return false;
  if (config.automation === "spectator") return true;
  return player === botSeatFor(humanSeat);
}

function difficultyForSeat(
  config: BotPlayerConfig,
  player: PlayerId,
): BotDifficulty {
  if (config.automation === "spectator") {
    return player === 1 ? config.p1Difficulty : config.p2Difficulty;
  }
  if (config.automation === "vsBot") return config.difficulty;
  return "medium";
}

function scheduleDelayMs(config: BotPlayerConfig): number {
  if (config.automation === "off") return 0;
  const hold = config.celebrationHoldMsRef.current ?? 0;
  if (config.automation === "vsBot") {
    return Math.min(hold, VS_BOT_CELEBRATION_CAP_MS);
  }
  if (!config.autoPlay) return -1;
  return Math.max(hold, config.paceMs);
}

export function useBotPlayer(config: BotPlayerConfig) {
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
  const retryCount = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightCleanup = useRef<(() => void) | null>(null);
  const prevPlyRef = useRef(ply);
  const inflightPlayerRef = useRef<PlayerId | null>(null);

  const [workerReady, setWorkerReady] = useState(false);
  const [botStatus, setBotStatus] = useState<BotUiStatus>("idle");
  const [botRetryToken, setBotRetryToken] = useState(0);

  const humanSeat: HumanSeat =
    config.automation === "vsBot" ? config.humanSeat : 1;
  const botSeat: PlayerId | null =
    config.automation === "vsBot" ? botSeatFor(humanSeat) : null;
  const botThinking = botStatus === "thinking" || botStatus === "retrying";
  const thinkingPlayer: PlayerId | null =
    config.automation === "off"
      ? null
      : phasePlayer !== null &&
          isAutomatedSeat(config, phasePlayer, humanSeat)
        ? phasePlayer
        : null;

  const configRef = useRef(config);
  configRef.current = config;
  const applyRef = useRef(applyBotCompoundMove);
  applyRef.current = applyBotCompoundMove;

  const clearPaceTimer = () => {
    if (paceTimerRef.current !== null) {
      clearTimeout(paceTimerRef.current);
      paceTimerRef.current = null;
    }
  };

  const cancelInflight = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    inflightCleanup.current?.();
    inflightCleanup.current = null;
    busy.current = false;
  };

  const recreateWorker = () => {
    workerRef.current?.terminate();
    workerRef.current = new BotWorker();
    setWorkerReady(true);
  };

  const finishBotTurn = (status: BotUiStatus) => {
    cancelInflight();
    setBotStatus(status);
  };

  const scheduleRetryOrFail = () => {
    retryCount.current += 1;
    if (retryCount.current >= MAX_BOT_RETRIES) {
      finishBotTurn("failed");
      console.warn("Bot could not apply a move after retries");
      return;
    }
    busy.current = false;
    setBotStatus("retrying");
    setBotRetryToken((t) => t + 1);
  };

  const applyMovePayload = (data: BotWorkerResponse) => {
    const expected = inflightPlayerRef.current;
    const applyBot = applyRef.current;
    const current = useGameStore.getState().state;
    if (current.phase.kind === "ended") {
      retryCount.current = 0;
      finishBotTurn("idle");
      return;
    }
    if (expected === null || current.phase.player !== expected) {
      retryCount.current = 0;
      finishBotTurn("idle");
      return;
    }

    if (data.move && applyBot(data.move)) {
      retryCount.current = 0;
      finishBotTurn("idle");
      return;
    }

    if (tryApplyAnyBotMove(applyBot)) {
      retryCount.current = 0;
      finishBotTurn("idle");
      return;
    }

    scheduleRetryOrFail();
  };

  const runSyncFallback = (): boolean => {
    if (tryApplyAnyBotMove(applyRef.current)) {
      retryCount.current = 0;
      finishBotTurn("idle");
      return true;
    }
    return false;
  };

  const scheduleBotMove = (kind: "turn" | "retry") => {
    const cfg = configRef.current;
    if (cfg.automation === "off") return;
    if (busy.current) return;

    const current = useGameStore.getState().state;
    if (current.phase.kind === "ended") return;
    const player = current.phase.player;
    if (!isAutomatedSeat(cfg, player, humanSeat)) return;

    const worker = workerRef.current;
    if (!worker) return;

    busy.current = true;
    setBotStatus(kind === "retry" ? "retrying" : "thinking");
    inflightPlayerRef.current = player;

    const id = ++reqId.current;
    const state = current;
    const options = botSearchOptions(difficultyForSeat(cfg, player));
    const timeoutMs = (options.timeMs ?? 800) + 250;

    const onMessage = (event: MessageEvent<BotWorkerResponse>) => {
      if (event.data.id !== id) return;
      cancelInflight();
      applyMovePayload(event.data);
    };

    const onError = () => {
      cancelInflight();
      recreateWorker();
      if (!runSyncFallback()) {
        scheduleRetryOrFail();
      }
    };

    const onTimeout = () => {
      cancelInflight();
      recreateWorker();
      if (!runSyncFallback()) {
        scheduleRetryOrFail();
      }
    };

    inflightCleanup.current = () => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
    };
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);

    timeoutRef.current = setTimeout(onTimeout, timeoutMs);

    worker.postMessage({
      id,
      state,
      player,
      options,
    } satisfies BotWorkerRequest);
  };

  const maybeScheduleBotTurn = (kind: "turn" | "retry") => {
    const cfg = configRef.current;
    if (cfg.automation === "off") return;
    if (busy.current) return;
    if (botStatus === "failed") return;

    const current = useGameStore.getState().state;
    if (current.phase.kind === "ended") return;
    if (
      !isAutomatedSeat(cfg, current.phase.player, humanSeat)
    ) {
      return;
    }

    const delay = scheduleDelayMs(cfg);
    if (delay < 0) return;

    clearPaceTimer();
    if (delay === 0) {
      scheduleBotMove(kind);
      return;
    }
    paceTimerRef.current = setTimeout(() => {
      paceTimerRef.current = null;
      scheduleBotMove(kind);
    }, delay);
  };

  const automationActive = config.automation !== "off";
  const spectatorAutoPlay =
    config.automation === "spectator" ? config.autoPlay : true;

  useEffect(() => {
    if (!spectatorAutoPlay) clearPaceTimer();
  }, [spectatorAutoPlay]);

  useEffect(() => {
    if (!automationActive) {
      clearPaceTimer();
      cancelInflight();
      setBotStatus("idle");
      setBotRetryToken(0);
      retryCount.current = 0;
      workerRef.current?.terminate();
      workerRef.current = null;
      setWorkerReady(false);
      return;
    }
    workerRef.current = new BotWorker();
    setWorkerReady(true);
    return () => {
      clearPaceTimer();
      cancelInflight();
      workerRef.current?.terminate();
      workerRef.current = null;
      setWorkerReady(false);
    };
  }, [automationActive, config.automation]);

  useEffect(() => {
    if (ply < prevPlyRef.current) {
      reqId.current += 1;
      retryCount.current = 0;
      clearPaceTimer();
      cancelInflight();
      setBotStatus("idle");
      setBotRetryToken(0);
    }
    prevPlyRef.current = ply;
  }, [ply]);

  useEffect(() => {
    if (!automationActive) return;
    if (phaseKind === "ended") {
      clearPaceTimer();
      cancelInflight();
      setBotStatus("idle");
      return;
    }
    if (phasePlayer === null) return;

    if (!isAutomatedSeat(config, phasePlayer, humanSeat)) {
      if (botStatus !== "failed") {
        clearPaceTimer();
        cancelInflight();
        setBotStatus("idle");
      }
      return;
    }
    if (botStatus === "failed") return;
    if (!workerReady) return;
    if (busy.current) return;

    const kind =
      botRetryToken > 0 && retryCount.current > 0 ? "retry" : "turn";
    maybeScheduleBotTurn(kind);
  }, [
    automationActive,
    config,
    humanSeat,
    ply,
    phaseKind,
    phasePlayer,
    workerReady,
    botRetryToken,
    applyBotCompoundMove,
    botStatus,
  ]);

  return {
    botThinking,
    botStatus,
    botSeat,
    humanSeat: config.automation === "vsBot" ? humanSeat : null,
    thinkingPlayer,
  };
}
