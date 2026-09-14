import type { AppSettings, GameMode, HumanSeat } from "@/lib/persistence";
import { chipToggleClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function segmentTab(active: boolean) {
  return cn(
    "rounded-md px-3 py-1.5 text-sm transition font-medium",
    active
      ? "bg-surface-1 text-text-primary shadow-sm"
      : "text-text-muted hover:text-text-primary",
  );
}

export function GameModeControls({
  gameMode,
  botDifficulty,
  humanSeat,
  onModeChange,
  onBotDifficulty,
  onHumanSeat,
  className,
}: {
  gameMode: GameMode;
  botDifficulty: AppSettings["botDifficulty"];
  humanSeat: HumanSeat;
  onModeChange: (mode: GameMode) => void;
  onBotDifficulty: (d: AppSettings["botDifficulty"]) => void;
  onHumanSeat: (seat: HumanSeat) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className="inline-flex rounded-xl border border-border-subtle bg-surface-2 p-1"
        role="group"
        aria-label="Game mode"
      >
        <button
          type="button"
          aria-pressed={gameMode === "local2p"}
          data-testid="mode-local2p"
          onClick={() => onModeChange("local2p")}
          className={segmentTab(gameMode === "local2p")}
        >
          Local 2P
        </button>
        <button
          type="button"
          aria-pressed={gameMode === "vsBot"}
          data-testid="mode-vsbot"
          onClick={() => onModeChange("vsBot")}
          className={segmentTab(gameMode === "vsBot")}
        >
          Vs bot
        </button>
      </div>
      {gameMode === "vsBot" && (
        <div className="flex flex-col items-center gap-2 text-xs">
          <div className="flex gap-1.5" role="group" aria-label="Bot difficulty">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <button
                key={d}
                type="button"
                data-testid={`bot-${d}`}
                onClick={() => onBotDifficulty(d)}
                className={chipToggleClass(botDifficulty === d)}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-text-muted">You play:</span>
            {([1, 2] as HumanSeat[]).map((seat) => (
              <button
                key={seat}
                type="button"
                data-testid={`seat-p${seat}`}
                onClick={() => onHumanSeat(seat)}
                className={chipToggleClass(humanSeat === seat)}
              >
                P{seat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
