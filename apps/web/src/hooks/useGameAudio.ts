import { useCallback, useEffect, useMemo, useRef } from "react";
import type { LineLedgerEntry } from "@numchess/engine";
import {
  maxContributionLevel,
} from "@/lib/audioTypes";
import {
  initAudioFromManifest,
  playSfx,
  preloadAllSfx,
  setMasterVolume,
  unlockAudio,
} from "@/lib/audio";
import type { AppSettings } from "@/lib/persistence";
import type { AudioManifest } from "@/lib/audioTypes";

export function useGameAudio(settings: AppSettings) {
  const readyRef = useRef(false);
  const prevLeaderRef = useRef<{
    leader: 1 | 2 | null;
    decisiveLevel: 2 | 3 | 4 | 5 | 6 | null;
  } | null>(null);
  const playedLineRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch("/audio/manifest.json")
      .then((r) => r.json())
      .then((data: AudioManifest) => {
        if (cancelled) return;
        initAudioFromManifest(data);
        preloadAllSfx();
        readyRef.current = true;
      })
      .catch(() => {
        /* manifest optional until generated */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (settings.muteSound) setMasterVolume(0);
    else setMasterVolume(settings.sfxVolume);
  }, [settings.muteSound, settings.sfxVolume]);

  const withUnlock = useCallback(
    (fn: () => void) => {
      if (settings.muteSound) return;
      unlockAudio();
      fn();
    },
    [settings.muteSound],
  );

  const play = useCallback(
    (id: import("@/lib/audioTypes").SfxId) => {
      withUnlock(() => playSfx(id));
    },
    [withUnlock],
  );

  const playSelect = useCallback(() => play("select"), [play]);
  const playPlace = useCallback(() => play("place"), [play]);
  const playUndo = useCallback(() => play("undo"), [play]);

  const playLevel5Celebrate = useCallback(() => {
    if (settings.muteSound) return;
    if (!settings.sfxLevelFanfare && !settings.sfxCelebration) return;
    withUnlock(() => playSfx("level_5_celebrate"));
  }, [
    settings.muteSound,
    settings.sfxLevelFanfare,
    settings.sfxCelebration,
    withUnlock,
  ]);

  const playLineLockFanfare = useCallback(
    (delta: {
      player1: LineLedgerEntry[];
      player2: LineLedgerEntry[];
    }) => {
      if (settings.muteSound) return;
      if (!settings.sfxLineLock && !settings.sfxLevelFanfare) return;

      const all = [
        ...delta.player1.map((e) => ({ player: 1 as const, entry: e })),
        ...delta.player2.map((e) => ({ player: 2 as const, entry: e })),
      ];

      for (const { entry } of all) {
        const key = entry.id;
        if (playedLineRef.current.has(key)) continue;
        playedLineRef.current.add(key);

        withUnlock(() => {
          if (settings.sfxLineLock) playSfx("line_lock");
          if (settings.sfxLevelFanfare) {
            const max = maxContributionLevel(entry.analysis.contributions);
            if (max === 5) {
              /* level_5_celebrate plays with board FX via playLevel5Celebrate */
            } else if (max === 4) playSfx("level_4");
          }
        });
      }
    },
    [
      settings.muteSound,
      settings.sfxLineLock,
      settings.sfxLevelFanfare,
      withUnlock,
    ],
  );

  const playLeadChange = useCallback(
    (leader: 1 | 2 | null, decisiveLevel: 2 | 3 | 4 | 5 | 6 | null) => {
      if (settings.muteSound) return;
      const prev = prevLeaderRef.current;
      prevLeaderRef.current = { leader, decisiveLevel };
      if (!prev || prev.leader === leader) return;
      if (leader === null) return;
      withUnlock(() => playSfx("lead_change"));
    },
    [settings.muteSound, withUnlock],
  );

  const playEnd = useCallback(
    (outcome: "win" | "draw", humanWon?: boolean) => {
      withUnlock(() => {
        if (outcome === "draw") playSfx("end_draw");
        else if (humanWon === false) playSfx("end_loss");
        else playSfx("end_win");
      });
    },
    [withUnlock],
  );

  const resetLineDebouncers = useCallback(() => {
    playedLineRef.current.clear();
    prevLeaderRef.current = null;
  }, []);

  return useMemo(
    () => ({
      playSelect,
      playPlace,
      playUndo,
      playLineLockFanfare,
      playLevel5Celebrate,
      playLeadChange,
      playEnd,
      resetLineDebouncers,
      unlock: () => withUnlock(() => {}),
    }),
    [
      playSelect,
      playPlace,
      playUndo,
      playLineLockFanfare,
      playLevel5Celebrate,
      playLeadChange,
      playEnd,
      resetLineDebouncers,
      withUnlock,
    ],
  );
}

export type GameAudio = ReturnType<typeof useGameAudio>;
