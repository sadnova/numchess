import { useCallback, useEffect, useRef, useState } from "react";
import type { CellValue, GameConfig } from "@numchess/engine";
import {
  celebrationsFromBoards,
  isTopTierCelebration,
  topCelebrationLevel,
  type LineCelebrationEvent,
} from "@/lib/lineCelebration";
import { celebrationHoldForLevel } from "@/lib/spectatorTiming";

export function useLineCelebrations(
  reduceMotion: boolean,
  config: GameConfig,
  onTopTierCelebrate?: () => void,
) {
  const [activeEvents, setActiveEvents] = useState<LineCelebrationEvent[]>([]);
  const celebrationHoldMsRef = useRef(0);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onPlyScored = useCallback(
    (prevBoard: CellValue[], nextBoard: CellValue[]) => {
      const events = celebrationsFromBoards(prevBoard, nextBoard, config);
      if (events.length === 0) {
        celebrationHoldMsRef.current = 0;
        return;
      }
      const maxLevel = topCelebrationLevel(events);
      const hold = celebrationHoldForLevel(maxLevel, reduceMotion);
      celebrationHoldMsRef.current = hold;

      if (reduceMotion || hold === 0) {
        setActiveEvents([]);
        return;
      }

      if (
        maxLevel !== null &&
        isTopTierCelebration(maxLevel, config)
      ) {
        onTopTierCelebrate?.();
      }

      setActiveEvents(events);
      if (clearTimerRef.current !== null) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => {
        clearTimerRef.current = null;
        setActiveEvents([]);
      }, hold);
    },
    [reduceMotion, onTopTierCelebrate, config],
  );

  useEffect(
    () => () => {
      if (clearTimerRef.current !== null) clearTimeout(clearTimerRef.current);
    },
    [],
  );

  return { activeEvents, celebrationHoldMsRef, onPlyScored };
}
