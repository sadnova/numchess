import { tileValuesFor, type TileValue } from "@numchess/engine";
import { useEffect } from "react";
import { canSelectTile, useGameStore } from "../store/gameStore";

export function useGameKeyboard(humanCanAct = true) {
  const cancelSelect = useGameStore((s) => s.cancelSelect);
  const undo = useGameStore((s) => s.undo);
  const selectTile = useGameStore((s) => s.selectTile);
  const phase = useGameStore((s) => s.state.phase);
  const state = useGameStore((s) => s.state);

  useEffect(() => {
    const tiles = tileValuesFor(state.config);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase.kind === "place") {
        cancelSelect();
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && phase.kind !== "ended") {
        e.preventDefault();
        undo();
      }
      if (phase.kind === "select" && humanCanAct && !e.ctrlKey && !e.metaKey) {
        const n = Number(e.key);
        if (!Number.isInteger(n)) return;
        const tile = n as TileValue;
        if (!tiles.includes(tile)) return;
        if (canSelectTile(state, tile)) {
          e.preventDefault();
          selectTile(tile);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelSelect, undo, selectTile, phase.kind, state, humanCanAct]);
}
