import {
  inventoryFor,
  tileValuesFor,
  type GameState,
  type PlayerId,
  type TileValue,
} from "@numchess/engine";
import { cn } from "@/lib/utils";

export function InventoryPanel({
  player,
  state,
  isTurn,
  selecting,
  heldTile,
  onSelect,
  canSelect,
}: {
  player: PlayerId;
  state: GameState;
  isTurn: boolean;
  selecting: boolean;
  heldTile: TileValue | null;
  onSelect: (v: TileValue) => void;
  canSelect: (v: TileValue) => boolean;
}) {
  const inv = state.inventories[player - 1].counts;
  const tiles = tileValuesFor(state.config);
  const starting = inventoryFor(state.config);
  const role = player === 1 ? "Rows" : "Columns";
  const isRows = player === 1;
  const holding = isTurn && heldTile !== null;

  return (
    <div
      data-testid={`inventory-p${player}`}
      className={cn(
        "rounded-2xl p-3 border transition bg-surface-1 shadow-sm w-full max-w-[220px]",
        isRows
          ? "border-accent-rows/30 bg-gradient-to-b from-accent-rows-soft/40 to-surface-1"
          : "border-accent-cols/30 bg-gradient-to-b from-accent-cols-soft/40 to-surface-1",
        isTurn && selecting && "ring-2 ring-accent-rows/35 shadow-md",
        holding && "ring-2 ring-amber-400/70",
        !isTurn && "opacity-55 saturate-50",
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted">
            Player {player}
          </p>
          <p
            className={cn(
              "text-sm font-semibold",
              isRows ? "text-accent-rows" : "text-accent-cols",
            )}
          >
            {role}
          </p>
        </div>
        {isTurn && (
          <span className="text-[10px] font-medium uppercase tracking-wide rounded-full bg-accent-action/10 text-accent-action px-2 py-0.5">
            Turn
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {tiles.map((t) => {
          const max = starting[t];
          const left = inv[t];
          const isHeld = holding && heldTile === t;
          const canPick =
            isTurn &&
            left > 0 &&
            (selecting ? canSelect(t) : holding && t !== heldTile);
          return (
            <button
              key={t}
              type="button"
              data-testid={`p${player}-tile-${t}`}
              disabled={!canPick && !isHeld}
              aria-pressed={isHeld}
              aria-label={`${t}, ${left} of ${max} remaining`}
              onClick={() => onSelect(t)}
              className={cn(
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-rows",
                "relative tile-num w-11 h-11 rounded-xl font-bold text-lg transition border",
                isHeld
                  ? "bg-amber-400 border-amber-500 text-text-primary scale-110 shadow-md ring-2 ring-amber-300/80 z-10"
                  : "bg-surface-1 border-border-subtle shadow-sm",
                canPick &&
                  !isHeld &&
                  "cursor-pointer hover:border-accent-rows/50 hover:shadow-md hover:-translate-y-0.5",
                !canPick && !isHeld && "opacity-35",
              )}
            >
              {t}
              <span
                className={cn(
                  "absolute -bottom-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-0.5 rounded-full text-[9px] font-semibold flex items-center justify-center border",
                  left > 0
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-border-subtle text-text-muted border-border-subtle",
                )}
                aria-hidden
              >
                {left}
              </span>
            </button>
          );
        })}
      </div>
      {holding && (
        <p className="text-center text-xs text-amber-800 mt-2 font-medium">
          Holding {heldTile} — click the board
        </p>
      )}
      {isTurn && selecting && !holding && (
        <p className="text-center text-xs text-text-muted mt-2">Pick a number</p>
      )}
    </div>
  );
}
