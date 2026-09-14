import { liveScoreLeader, scoreLiveLevels, type GameState } from "@numchess/engine";
import { useMemo } from "react";

export function useLiveScore(state: GameState) {
  return useMemo(() => {
    const levels = scoreLiveLevels(state);
    const leader = liveScoreLeader(levels);
    return { levels, leader };
  }, [state.board]);
}
