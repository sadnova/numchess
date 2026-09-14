import { chipToggleClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  SPECTATOR_PACE_NORMAL_MS,
  SPECTATOR_PACE_SLOW_MS,
} from "@/lib/spectatorTiming";

export function SpectatorTransportControls({
  autoPlay,
  paceMs,
  onAutoPlayChange,
  onPaceChange,
  className,
}: {
  autoPlay: boolean;
  paceMs: number;
  onAutoPlayChange: (playing: boolean) => void;
  onPaceChange: (ms: number) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 w-full max-w-md",
        className,
      )}
    >
      <button
        type="button"
        data-testid="spectator-play-pause"
        aria-pressed={autoPlay}
        aria-label={autoPlay ? "Pause autoplay" : "Resume autoplay"}
        onClick={() => onAutoPlayChange(!autoPlay)}
        className={cn(
          "rounded-lg border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-medium",
          "hover:bg-surface-2 transition",
        )}
      >
        {autoPlay ? "Pause" : "Play"}
      </button>
      <div
        className="flex gap-1.5 flex-wrap justify-center"
        role="group"
        aria-label="Simulation speed"
      >
        <button
          type="button"
          data-testid="spectator-pace-off"
          onClick={() => onPaceChange(0)}
          className={chipToggleClass(paceMs === 0)}
        >
          Fast
        </button>
        <button
          type="button"
          data-testid="spectator-pace-normal"
          onClick={() => onPaceChange(SPECTATOR_PACE_NORMAL_MS)}
          className={chipToggleClass(paceMs === SPECTATOR_PACE_NORMAL_MS)}
        >
          Normal
        </button>
        <button
          type="button"
          data-testid="spectator-pace-slow"
          onClick={() => onPaceChange(SPECTATOR_PACE_SLOW_MS)}
          className={chipToggleClass(paceMs === SPECTATOR_PACE_SLOW_MS)}
        >
          Slow
        </button>
      </div>
    </div>
  );
}
