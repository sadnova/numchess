import { liveScoreLeader, scoreLiveLevels, type GameState } from "@numchess/engine";
import { useMemo } from "react";

export function useLiveScore(state: GameState) {
  return useMemo(() => {
    const levels = scoreLiveLevels(state);
    const leader = liveScoreLeader(levels, state.config);
    return { levels, leader };
  }, [state.board, state.config]);
}
