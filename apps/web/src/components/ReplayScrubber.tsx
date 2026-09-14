import { useMemo } from "react";
import {
  BOARD_SIZE,
  CELL_COUNT,
  indexToRowCol,
  type GameState,
} from "@numchess/engine";
import type { ReplayFile } from "@numchess/replay";
import { stateAtReplayStep } from "../lib/replay";

export function ReplayScrubber({
  file,
  step,
  onStepChange,
  onClose,
}: {
  file: ReplayFile;
  step: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
}) {
  const maxStep = file.actions.length;
  const preview = useMemo(() => stateAtReplayStep(file, step), [file, step]);

  if (!preview) {
    return (
      <section className="text-red-400 text-sm">Invalid replay at this step.</section>
    );
  }

  return (
    <section
      className="w-full max-w-md p-4 rounded-2xl bg-accent-rows-soft border border-accent-rows/25 space-y-3"
      aria-label="Replay review"
    >
      <div className="flex justify-between items-center gap-2">
        <h2 className="font-semibold text-sm">Replay review</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-xs underline text-text-muted"
        >
          Close
        </button>
      </div>
      <label className="flex flex-col gap-1 text-xs">
        <span>
          Move {step} / {maxStep}
          {preview && preview.phase.kind !== "ended" && (
            <> · ply {preview.ply}</>
          )}
        </span>
        <input
          type="range"
          min={0}
          max={maxStep}
          value={step}
          onChange={(e) => onStepChange(Number(e.target.value))}
          className="w-full"
        />
      </label>
      <ReadOnlyBoard state={preview} />
      {preview.phase.kind !== "ended" && (
        <p className="text-xs tile-num opacity-80">
          P1 tiles left:{" "}
          {Object.values(preview.inventories[0].counts).reduce((a, b) => a + b, 0)}{" "}
          · P2:{" "}
          {Object.values(preview.inventories[1].counts).reduce((a, b) => a + b, 0)}
        </p>
      )}
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          disabled={step <= 0}
          onClick={() => onStepChange(Math.max(0, step - 1))}
          className="px-2 py-1 rounded bg-surface-2 border border-border-subtle disabled:opacity-40"
        >
          −1
        </button>
        <button
          type="button"
          disabled={step >= maxStep}
          onClick={() => onStepChange(Math.min(maxStep, step + 1))}
          className="px-2 py-1 rounded bg-surface-2 border border-border-subtle disabled:opacity-40"
        >
          +1
        </button>
      </div>
    </section>
  );
}

function ReadOnlyBoard({ state }: { state: GameState }) {
  return (
    <div
      className="grid gap-1 p-2 rounded-xl bg-surface-2 border border-border-subtle"
      style={{
        gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(36px, 1fr))`,
      }}
    >
      {Array.from({ length: CELL_COUNT }, (_, index) => {
        const { row, col } = indexToRowCol(index);
        const value = state.board[index];
        return (
          <div
            key={index}
            className="aspect-square rounded-lg border border-border-subtle bg-surface-1 flex items-center justify-center tile-num text-lg text-text-primary"
            title={`R${row + 1} C${col + 1}`}
          >
            {value ?? "·"}
          </div>
        );
      })}
    </div>
  );
}
