import { useEffect } from "react";
import type { TileValue } from "@numchess/engine";
import { canSelectTile, useGameStore } from "../store/gameStore";

const KEY_TO_TILE: Record<string, TileValue> = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
};

export function useGameKeyboard() {
  const cancelSelect = useGameStore((s) => s.cancelSelect);
  const undo = useGameStore((s) => s.undo);
  const selectTile = useGameStore((s) => s.selectTile);
  const phase = useGameStore((s) => s.state.phase);
  const state = useGameStore((s) => s.state);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase.kind === "place") {
        cancelSelect();
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && phase.kind !== "ended") {
        e.preventDefault();
        undo();
      }
      if (phase.kind === "select" && !e.ctrlKey && !e.metaKey) {
        const tile = KEY_TO_TILE[e.key];
        if (tile && canSelectTile(state, tile)) {
          e.preventDefault();
          selectTile(tile);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelSelect, undo, selectTile, phase.kind, state]);
}
