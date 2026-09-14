import { forwardRef, useCallback, useState } from "react";
import {
  BOARD_SIZE,
  indexToRowCol,
  type TileValue,
} from "@numchess/engine";
import type { GameState } from "@numchess/engine";
import { tileValueClass } from "@/lib/tileStyles";
import { cn } from "@/lib/utils";
import {
  DiagonalGuidesLegend,
  DiagonalGuidesOverlay,
} from "./DiagonalGuidesOverlay";
import { LineCelebrationOverlay } from "./LineCelebrationOverlay";
import type { LineCelebrationEvent } from "@/lib/lineCelebration";

export type BoardProps = {
  state: GameState;
  selecting: boolean;
  placing: boolean;
  heldTile: TileValue | null;
  legalPlaces: number[];
  highlightIndices?: number[];
  showDiagonalGuides?: boolean;
  onPlace: (index: number) => void;
  reduceMotion?: boolean;
  interactionDisabled?: boolean;
  celebrationEvents?: LineCelebrationEvent[];
};

export const Board = forwardRef<HTMLDivElement, BoardProps>(function Board(
  {
    state,
    selecting,
    placing,
    heldTile,
    legalPlaces,
    highlightIndices,
    showDiagonalGuides = false,
    onPlace,
    reduceMotion = false,
    interactionDisabled = false,
    celebrationEvents = [],
  },
  ref,
) {
  const [gridEl, setGridEl] = useState<HTMLDivElement | null>(null);
  const gridRef = useCallback(
    (node: HTMLDivElement | null) => {
      setGridEl(node);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  return (
    <div
      data-testid="app-board-wrap"
      className="w-full max-w-[min(92vw,420px)]"
    >
      <div className="relative w-full">
        <div
          className={cn(
            "relative z-[2] grid gap-1.5 p-3 rounded-2xl border w-full transition",
            "shadow-[var(--shadow-panel)]",
            placing
              ? "bg-placement-muted border-amber-400/60 ring-2 ring-amber-400/25"
              : "bg-surface-2/90 border-border-subtle",
          )}
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(44px, 1fr))`,
          }}
          ref={gridRef}
          data-testid="app-board"
          role="grid"
          aria-rowcount={BOARD_SIZE}
          aria-colcount={BOARD_SIZE}
          aria-label="Shared game board"
        >
      {Array.from({ length: BOARD_SIZE }, (_, row) => (
        <div role="row" aria-rowindex={row + 1} key={row} className="contents">
          {Array.from({ length: BOARD_SIZE }, (_, col) => {
            const index = row * BOARD_SIZE + col;
            const { row: r, col: c } = indexToRowCol(index);
            const value = state.board[index];
            const canPlace = legalPlaces.includes(index);
            const onLine = highlightIndices?.includes(index) ?? false;
            return (
              <button
                key={index}
                type="button"
                data-testid={`cell-${index}`}
                role="gridcell"
                aria-colindex={col + 1}
                tabIndex={canPlace && !selecting ? 0 : -1}
                aria-label={
                  value
                    ? `Row ${r + 1} column ${c + 1}, value ${value}`
                    : canPlace && placing
                      ? `Row ${r + 1} column ${c + 1}, empty, click to place ${heldTile}`
                      : `Row ${r + 1} column ${c + 1}, empty`
                }
                disabled={interactionDisabled || selecting || !canPlace}
                onClick={() => {
                  if (interactionDisabled) return;
                  onPlace(index);
                }}
                className={cn(
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-rows",
                  "tile-num aspect-square rounded-xl text-2xl font-semibold transition border",
                  "motion-safe:animate-[place_0.25s_ease-out]",
                  !reduceMotion &&
                    canPlace &&
                    placing &&
                    "motion-safe:animate-[pulse-place_1.2s_ease-in-out_infinite]",
                  value
                    ? "bg-surface-1 text-text-primary border-border-subtle shadow-[var(--shadow-cell-raised)]"
                    : "bg-surface-1/60 border-border-subtle/70",
                  tileValueClass(value),
                  onLine && !placing && "bg-accent-rows-soft border-accent-rows/40",
                  canPlace &&
                    placing &&
                    "ring-2 ring-amber-500 cursor-pointer bg-placement-muted border-amber-500/50 text-text-primary",
                  !reduceMotion &&
                    canPlace &&
                    placing &&
                    "hover:scale-105",
                  selecting && !value && "opacity-50",
                  !value && !canPlace && "text-text-muted/40",
                )}
              >
                {value ?? (placing && canPlace ? heldTile : "·")}
              </button>
            );
          })}
        </div>
      ))}
        </div>
        {showDiagonalGuides && gridEl ? (
          <DiagonalGuidesOverlay gridEl={gridEl} />
        ) : null}
        <LineCelebrationOverlay
          gridEl={gridEl}
          events={celebrationEvents}
          reduceMotion={reduceMotion}
        />
      </div>
      <DiagonalGuidesLegend visible={showDiagonalGuides} />
    </div>
  );
});
