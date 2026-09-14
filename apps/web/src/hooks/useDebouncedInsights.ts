import { useEffect, useState } from "react";
import {
  analyzePositionForPlayer,
  type GameState,
  type LineInsight,
  type PlayerId,
} from "@numchess/engine";

export function useDebouncedInsights(
  state: GameState,
  player: PlayerId | null,
  ms = 50,
): LineInsight[] {
  const [insights, setInsights] = useState<LineInsight[]>([]);

  useEffect(() => {
    if (player === null) {
      setInsights([]);
      return;
    }
    const run = () => setInsights(analyzePositionForPlayer(state, player));
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(run, { timeout: ms });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, ms);
    return () => window.clearTimeout(t);
  }, [state, player, ms]);

  return insights;
}
