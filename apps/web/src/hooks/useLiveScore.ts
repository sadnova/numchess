import { scoreCompletedLines, liveScoreLeader, type GameState } from "@numchess/engine";
import { useMemo } from "react";

export function useLiveScore(state: GameState) {
  return useMemo(() => {
    const scored = scoreCompletedLines(state);
    const leader = liveScoreLeader(scored.levels);
    return { ...scored, leader };
  }, [state.board]);
}
