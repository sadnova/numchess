import { useCallback, useEffect, useRef, useState } from "react";
import type { CellValue } from "@numchess/engine";
import {
  celebrationsFromBoards,
  type LineCelebrationEvent,
} from "@/lib/lineCelebration";
import { celebrationHoldForLevel } from "@/lib/spectatorTiming";

export function useLineCelebrations(
  reduceMotion: boolean,
  onLevel5Celebrate?: () => void,
) {
  const [activeEvents, setActiveEvents] = useState<LineCelebrationEvent[]>([]);
  const celebrationHoldMsRef = useRef(0);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onPlyScored = useCallback(
    (prevBoard: CellValue[], nextBoard: CellValue[]) => {
      const events = celebrationsFromBoards(prevBoard, nextBoard);
      if (events.length === 0) {
        celebrationHoldMsRef.current = 0;
        return;
      }
      const maxLevel = events.reduce<4 | 5 | null>(
        (acc, e) => (acc === null || e.level > acc ? e.level : acc),
        null,
      );
      const hold = celebrationHoldForLevel(maxLevel, reduceMotion);
      celebrationHoldMsRef.current = hold;

      if (reduceMotion || hold === 0) {
        setActiveEvents([]);
        return;
      }

      if (maxLevel === 5) {
        onLevel5Celebrate?.();
      }

      setActiveEvents(events);
      if (clearTimerRef.current !== null) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => {
        clearTimerRef.current = null;
        setActiveEvents([]);
      }, hold);
    },
    [reduceMotion, onLevel5Celebrate],
  );

  useEffect(
    () => () => {
      if (clearTimerRef.current !== null) clearTimeout(clearTimerRef.current);
    },
    [],
  );

  return { activeEvents, celebrationHoldMsRef, onPlyScored };
}
