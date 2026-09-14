import { useEffect, useRef, type RefObject } from "react";
import { BOARD_SIZE } from "@numchess/engine";
import { legalPlaceIndices, useGameStore } from "../store/gameStore";

function indexFromRowCol(row: number, col: number): number {
  return row * BOARD_SIZE + col;
}

export function useBoardKeyboard(
  gridRef: RefObject<HTMLDivElement | null>,
  enabled = true,
) {
  const phase = useGameStore((s) => s.state.phase);
  const focusRef = useRef(0);

  useEffect(() => {
    const grid = gridRef.current;
    if (!enabled || !grid || phase.kind !== "place") return;

    const places = legalPlaceIndices(useGameStore.getState().state);
    if (places.length === 0) return;

    const focusCell = (index: number) => {
      const buttons = grid.querySelectorAll<HTMLButtonElement>(
        'button[role="gridcell"]',
      );
      const btn = buttons[index];
      if (btn && !btn.disabled) {
        focusRef.current = index;
        btn.focus();
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && grid.contains(document.activeElement)) {
        const idx = focusRef.current;
        const st = useGameStore.getState().state;
        if (st.phase.kind === "place" && legalPlaceIndices(st).includes(idx)) {
          e.preventDefault();
          useGameStore.getState().placeAt(idx);
        }
      }
      if (!grid.contains(document.activeElement)) return;
      const { row, col } = {
        row: Math.floor(focusRef.current / BOARD_SIZE),
        col: focusRef.current % BOARD_SIZE,
      };
      let nr = row;
      let nc = col;
      if (e.key === "ArrowUp") nr = Math.max(0, row - 1);
      else if (e.key === "ArrowDown") nr = Math.min(BOARD_SIZE - 1, row + 1);
      else if (e.key === "ArrowLeft") nc = Math.max(0, col - 1);
      else if (e.key === "ArrowRight") nc = Math.min(BOARD_SIZE - 1, col + 1);
      else return;

      e.preventDefault();
      let next = indexFromRowCol(nr, nc);
      if (!places.includes(next)) {
        const sorted = [...places].sort(
          (a, b) =>
            Math.abs(a - indexFromRowCol(nr, nc)) -
            Math.abs(b - indexFromRowCol(nr, nc)),
        );
        next = sorted[0] ?? next;
      }
      focusCell(next);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gridRef, phase.kind, enabled]);
}
