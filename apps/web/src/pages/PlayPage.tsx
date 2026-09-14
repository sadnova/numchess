import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  createSandboxState,
  lineScoreDelta,
  type TileValue,
} from "@numchess/engine";
import type { ReplayFile } from "@numchess/replay";
import { InventoryPanel } from "../components/InventoryPanel";
import { Board } from "../components/game/Board";
import { EndScreen } from "../components/game/EndScreen";
import { GameFooter } from "../components/game/GameFooter";
import { GameModeControls } from "../components/game/GameModeControls";
import { SpectatorTransportControls } from "../components/game/SpectatorTransportControls";
import { LiveScorePanel } from "../components/game/LiveScorePanel";
import { ScoreFeed } from "../components/game/ScoreFeed";
import { LineInsightsPanel } from "../components/game/LineInsightsPanel";
import { SettingsSheet } from "../components/game/SettingsSheet";
import { TurnBanner } from "../components/game/TurnBanner";
import { AppTopBar } from "../components/layout/AppTopBar";
import { PlayLayout } from "../components/layout/PlayLayout";
import { ReplayScrubber } from "../components/ReplayScrubber";
import { RulesDialog } from "../components/RulesDialog";
import { useBoardKeyboard } from "../hooks/useBoardKeyboard";
import { useBotPlayer, type BotPlayerConfig } from "../hooks/useBotPlayer";
import { useLineCelebrations } from "../hooks/useLineCelebrations";
import { useDebouncedInsights } from "../hooks/useDebouncedInsights";
import { useGameKeyboard } from "../hooks/useGameKeyboard";
import { useGameAudio } from "../hooks/useGameAudio";
import { useLiveScore } from "../hooks/useLiveScore";
import { usePlayTutorial } from "../hooks/usePlayTutorial";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { findLineIndices, lineCategory } from "../lib/lines";
import { entriesFromLineDelta, type ScoreFeedEntry } from "../lib/scoreFeed";
import { canHumanAct } from "../lib/playVsBot";
import {
  isSandboxMode,
  loadSettings,
  resolveFirstPlayer,
  saveSettings,
  type AppSettings,
  type GameMode,
  type HumanSeat,
} from "../lib/persistence";
import {
  buildReplayFromState,
  exportReplayJson,
  importReplayJson,
} from "../lib/replay";
import {
  canSelectTile,
  legalPlaceIndices,
  startedFromResume,
  useGameStore,
} from "../store/gameStore";

export function PlayPage() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const effectiveMode: GameMode =
    isSandboxMode() ? "sandbox" : settings.gameMode;
  const isVsBot = effectiveMode === "vsBot";
  const isBotSpectator = effectiveMode === "botSpectator";
  const reducedMotion = useReducedMotion(settings.reduceMotion);
  const sounds = useGameAudio(settings);
  const { activeEvents, celebrationHoldMsRef, onPlyScored } =
    useLineCelebrations(reducedMotion, sounds.playLevel5Celebrate);

  const botConfig = useMemo((): BotPlayerConfig => {
    if (isVsBot) {
      return {
        automation: "vsBot",
        difficulty: settings.botDifficulty,
        humanSeat: settings.humanSeat,
        celebrationHoldMsRef,
      };
    }
    if (isBotSpectator) {
      return {
        automation: "spectator",
        p1Difficulty: settings.botP1Difficulty,
        p2Difficulty: settings.botP2Difficulty,
        autoPlay: settings.spectatorAutoPlay,
        paceMs: settings.spectatorPaceMs,
        celebrationHoldMsRef,
      };
    }
    return { automation: "off" };
  }, [
    isVsBot,
    isBotSpectator,
    settings.botDifficulty,
    settings.humanSeat,
    settings.botP1Difficulty,
    settings.botP2Difficulty,
    settings.spectatorAutoPlay,
    settings.spectatorPaceMs,
    celebrationHoldMsRef,
  ]);

  const {
    botThinking,
    botStatus,
    thinkingPlayer,
  } = useBotPlayer(botConfig);

  usePlayTutorial(
    settings.showTutorialOnPlay &&
      effectiveMode !== "sandbox" &&
      effectiveMode !== "botSpectator" &&
      !reducedMotion,
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importToast, setImportToast] = useState<string | null>(null);
  const [highlightLineId, setHighlightLineId] = useState<string | null>(null);
  const [replayReview, setReplayReview] = useState<{
    file: ReplayFile;
    step: number;
  } | null>(null);
  const [showResumeNote, setShowResumeNote] = useState(startedFromResume);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const state = useGameStore((s) => s.state);
  const live = useLiveScore(state);
  const [scoreFeed, setScoreFeed] = useState<ScoreFeedEntry[]>([]);
  const [pulseKey, setPulseKey] = useState("");
  const prevBoardRef = useRef(state.board);
  const prevPlyRef = useRef(state.ply);
  const endPlayedRef = useRef(false);
  const selectTile = useGameStore((s) => s.selectTile);
  const placeAt = useGameStore((s) => s.placeAt);
  const cancelSelect = useGameStore((s) => s.cancelSelect);
  const undo = useGameStore((s) => s.undo);
  const newGame = useGameStore((s) => s.newGame);
  const loadState = useGameStore((s) => s.loadState);

  const phase = state.phase;
  const activePlayer = phase.kind === "ended" ? null : phase.player;
  const places = legalPlaceIndices(state);
  const selecting = phase.kind === "select";
  const heldTile = phase.kind === "place" ? phase.selected : null;
  const placing = phase.kind === "place";

  const humanCanAct = canHumanAct({
    isVsBot,
    isBotSpectator,
    humanSeat: settings.humanSeat,
    activePlayer,
    botThinking,
  });

  useGameKeyboard(humanCanAct);

  useLayoutEffect(() => {
    if (state.ply > prevPlyRef.current) {
      onPlyScored(prevBoardRef.current, state.board);
    }
  }, [state.ply, state.board, onPlyScored]);

  useBoardKeyboard(gridRef, humanCanAct && placing);

  const handleInventorySelect = (v: TileValue) => {
    if (!humanCanAct) return;
    sounds.playSelect();
    if (placing && activePlayer !== null) {
      if (heldTile === v) return;
      if (heldTile !== null) cancelSelect();
    }
    selectTile(v);
  };

  useEffect(() => {
    if (state.ply < prevPlyRef.current) {
      setScoreFeed([]);
      sounds.resetLineDebouncers();
    } else if (state.ply > prevPlyRef.current) {
      const delta = lineScoreDelta(prevBoardRef.current, state.board);
      const newEntries = entriesFromLineDelta(delta);
      if (newEntries.length > 0) {
        setScoreFeed((f) => [...newEntries, ...f].slice(0, 12));
        sounds.playLineLockFanfare(delta);
        if (!settings.reduceMotion) {
          const lv = newEntries
            .flatMap((e) => e.text.match(/L[2-5]/g) ?? [])
            .join(",");
          setPulseKey(`${Date.now()}-${lv}`);
        }
      }
      sounds.playLeadChange(live.leader.leader, live.leader.decisiveLevel);
    }
    prevBoardRef.current = state.board;
    prevPlyRef.current = state.ply;
  }, [state.board, state.ply, sounds, live.leader.leader, live.leader.decisiveLevel, settings.reduceMotion]);

  useEffect(() => {
    if (phase.kind !== "ended") {
      endPlayedRef.current = false;
      return;
    }
    if (endPlayedRef.current) return;
    endPlayedRef.current = true;
    const result = phase.result;
    if (result.outcome === "draw") {
      sounds.playEnd("draw");
      return;
    }
    const humanSeat = settings.humanSeat;
    const humanWon =
      effectiveMode === "vsBot"
        ? result.winner === humanSeat
        : undefined;
    sounds.playEnd("win", humanWon);
  }, [phase, sounds, settings.humanSeat, effectiveMode]);

  const rawInsights = useDebouncedInsights(state, activePlayer);
  const insights = rawInsights.filter((line) => {
    const cat = lineCategory(line.lineId);
    if (cat === "row" && !settings.showRowOverlays) return false;
    if (cat === "col" && !settings.showColOverlays) return false;
    if (cat === "diag" && !settings.showDiagOverlays) return false;
    return true;
  });

  useEffect(() => {
    if (effectiveMode !== "sandbox" || startedFromResume) return;
    loadState(createSandboxState());
  }, [effectiveMode, loadState, startedFromResume]);

  const highlightIndices = highlightLineId
    ? findLineIndices(highlightLineId)
    : undefined;

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const startNewGame = () => {
    setScoreFeed([]);
    sounds.resetLineDebouncers();
    if (effectiveMode === "botSpectator") {
      updateSettings({ spectatorAutoPlay: true });
    }
    const { first, settingsPatch } = resolveFirstPlayer(settings);
    if (Object.keys(settingsPatch).length > 0) {
      updateSettings(settingsPatch);
    }
    if (effectiveMode === "sandbox") {
      newGame({ initialState: createSandboxState() });
    } else {
      newGame({ firstPlayer: first });
    }
  };

  const setGameMode = (gameMode: GameMode) => {
    if (gameMode === settings.gameMode) return;
    updateSettings({ gameMode });
    startNewGame();
  };

  const openReplayReview = () => {
    const file = buildReplayFromState(state);
    setReplayReview({ file, step: file.actions.length });
  };

  const exportReplay = () => {
    const json = exportReplayJson(state);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `numchess-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = (file: File) => {
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const result = importReplayJson(text);
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      loadState(result.state);
      setScoreFeed([]);
      sounds.resetLineDebouncers();
      setImportToast(
        result.warning ? `Loaded — ${result.warning}` : "Replay loaded",
      );
      setTimeout(() => setImportToast(null), 3000);
    };
    reader.readAsText(file);
  };

  const inventoryProps = (player: 1 | 2) => ({
    player,
    state,
    isTurn: activePlayer === player && humanCanAct,
    selecting: selecting && activePlayer === player && humanCanAct,
    heldTile: activePlayer === player && humanCanAct ? heldTile : null,
    onSelect: handleInventorySelect,
    canSelect: (v: TileValue) =>
      humanCanAct && canSelectTile(state, v),
  });

  return (
    <>
      <PlayLayout
        topBar={
          <AppTopBar
            onOpenRules={() => setRulesOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            resumeNote={
              showResumeNote ? (
                <p className="text-xs text-amber-800 text-center mt-2">
                  Resumed your last casual game.{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setShowResumeNote(false)}
                  >
                    Dismiss
                  </button>
                </p>
              ) : undefined
            }
            modeControls={
              effectiveMode !== "sandbox" ? (
                <GameModeControls
                  gameMode={settings.gameMode}
                  botDifficulty={settings.botDifficulty}
                  botP1Difficulty={settings.botP1Difficulty}
                  botP2Difficulty={settings.botP2Difficulty}
                  humanSeat={settings.humanSeat}
                  onModeChange={setGameMode}
                  onBotDifficulty={(d) => updateSettings({ botDifficulty: d })}
                  onBotP1Difficulty={(d) =>
                    updateSettings({ botP1Difficulty: d })
                  }
                  onBotP2Difficulty={(d) =>
                    updateSettings({ botP2Difficulty: d })
                  }
                  onHumanSeat={(seat: HumanSeat) => {
                    updateSettings({ humanSeat: seat });
                    startNewGame();
                  }}
                />
              ) : null
            }
            sandboxBanner={
              effectiveMode === "sandbox" ? (
                <p className="text-xs text-amber-800 text-center mt-2">
                  Sandbox fixture loaded
                </p>
              ) : undefined
            }
          />
        }
        leftRail={<InventoryPanel {...inventoryProps(1)} />}
        rightRail={<InventoryPanel {...inventoryProps(2)} />}
        turnBanner={
          <div className="flex flex-col items-center gap-2 w-full">
            <TurnBanner
              phase={phase}
              activePlayer={activePlayer}
              selecting={selecting}
              placing={placing}
              heldTile={heldTile}
              ply={state.ply}
              arenaClockEnabled={settings.arenaClockEnabled}
              arenaMoveLimitSec={settings.arenaMoveLimitSec}
              onCancelSelect={cancelSelect}
              isVsBot={isVsBot}
              isBotSpectator={isBotSpectator}
              spectatorPaused={isBotSpectator && !settings.spectatorAutoPlay}
              humanSeat={settings.humanSeat}
              botThinking={botThinking}
              botStatus={botStatus}
              thinkingPlayer={thinkingPlayer}
            />
            {isBotSpectator && (
              <SpectatorTransportControls
                autoPlay={settings.spectatorAutoPlay}
                paceMs={settings.spectatorPaceMs}
                onAutoPlayChange={(playing) =>
                  updateSettings({ spectatorAutoPlay: playing })
                }
                onPaceChange={(ms) =>
                  updateSettings({ spectatorPaceMs: ms })
                }
              />
            )}
            <LiveScorePanel
              levels={live.levels}
              leader={live.leader.leader}
              decisiveLevel={live.leader.decisiveLevel}
              pulseKey={pulseKey}
            />
          </div>
        }
        board={
          <Board
            ref={gridRef}
            state={state}
            selecting={selecting}
            placing={placing}
            heldTile={heldTile}
            legalPlaces={places}
            highlightIndices={highlightIndices}
            showDiagonalGuides={settings.showDiagOverlays}
            reduceMotion={reducedMotion}
            celebrationEvents={activeEvents}
            onPlace={(index) => {
              if (!humanCanAct) return;
              sounds.playPlace();
              placeAt(index);
            }}
            interactionDisabled={!humanCanAct}
          />
        }
        belowBoard={
          <>
            <LineInsightsPanel
              insights={insights}
              overlaySettings={{
                showRowOverlays: settings.showRowOverlays,
                showColOverlays: settings.showColOverlays,
                showDiagOverlays: settings.showDiagOverlays,
              }}
              onOverlayChange={updateSettings}
              onHighlightLine={setHighlightLineId}
            />
            {replayReview && (
              <ReplayScrubber
                file={replayReview.file}
                step={replayReview.step}
                onStepChange={(step) =>
                  setReplayReview((r) => (r ? { ...r, step } : null))
                }
                onClose={() => setReplayReview(null)}
              />
            )}
            {phase.kind === "ended" && (
              <EndScreen result={phase.result} onNewGame={startNewGame} />
            )}
          </>
        }
        footer={
          <div className="w-full max-w-lg mx-auto space-y-3">
            <ScoreFeed entries={scoreFeed} />
            <GameFooter
            phase={phase}
            fileInputRef={fileRef}
            importError={importError}
            importToast={importToast}
            onUndo={() => {
              sounds.playUndo();
              undo();
            }}
            onNewGame={startNewGame}
            onReview={openReplayReview}
            onExport={exportReplay}
            onCopy={() => void navigator.clipboard.writeText(exportReplayJson(state))}
            onImportClick={() => fileRef.current?.click()}
            onImportFile={onImportFile}
          />
          </div>
        }
      />
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onChange={updateSettings}
      />
      <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </>
  );
}
