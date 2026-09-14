import { useEffect, useRef, type RefObject } from "react";
import { legalPlaceIndices, useGameStore } from "../store/gameStore";

export function useBoardKeyboard(
  gridRef: RefObject<HTMLDivElement | null>,
  enabled = true,
) {
  const phase = useGameStore((s) => s.state.phase);
  const boardSize = useGameStore((s) => s.state.config.boardSize);
  const focusRef = useRef(0);

  useEffect(() => {
    const grid = gridRef.current;
    if (!enabled || !grid || phase.kind !== "place") return;

    const indexFromRowCol = (row: number, col: number) =>
      row * boardSize + col;

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
        row: Math.floor(focusRef.current / boardSize),
        col: focusRef.current % boardSize,
      };
      let nr = row;
      let nc = col;
      if (e.key === "ArrowUp") nr = Math.max(0, row - 1);
      else if (e.key === "ArrowDown") nr = Math.min(boardSize - 1, row + 1);
      else if (e.key === "ArrowLeft") nc = Math.max(0, col - 1);
      else if (e.key === "ArrowRight") nc = Math.min(boardSize - 1, col + 1);
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
  }, [gridRef, phase.kind, enabled, boardSize]);
}
