import type { Phase, TileValue } from "@numchess/engine";
import type { HumanSeat } from "@/lib/persistence";
import { botSeatFor } from "@/lib/playVsBot";
import { MatchClock } from "@/components/MatchClock";
import { cn } from "@/lib/utils";

type TurnBannerProps = {
  phase: Phase;
  activePlayer: 1 | 2 | null;
  selecting: boolean;
  placing: boolean;
  heldTile: TileValue | null;
  ply: number;
  arenaClockEnabled: boolean;
  arenaMoveLimitSec: number;
  onCancelSelect: () => void;
  isVsBot?: boolean;
  humanSeat?: HumanSeat;
  botThinking?: boolean;
};

export function TurnBanner({
  phase,
  activePlayer,
  selecting,
  placing,
  heldTile,
  ply,
  arenaClockEnabled,
  arenaMoveLimitSec,
  onCancelSelect,
  isVsBot = false,
  humanSeat = 1,
  botThinking = false,
}: TurnBannerProps) {
  if (phase.kind === "ended" || activePlayer === null) return null;

  const botSeat = botSeatFor(humanSeat);
  const isHumanTurn = !isVsBot || activePlayer === humanSeat;

  let headline: string;
  if (isVsBot && !isHumanTurn && botThinking) {
    headline = `Bot thinking… (Player ${botSeat})`;
  } else if (isVsBot && isHumanTurn) {
    headline = `Your turn — Player ${humanSeat}`;
  } else {
    headline = `Player ${activePlayer}`;
  }

  return (
    <div
      className="text-center space-y-2 max-w-md w-full"
      role="status"
      aria-live="polite"
      data-testid={
        isVsBot && !isHumanTurn && botThinking ? "turn-bot-thinking" : undefined
      }
    >
      <p className="text-lg font-medium text-text-primary">
        {headline}
        {isHumanTurn && selecting && " — click a number in your inventory"}
        {isHumanTurn && placing && heldTile !== null && (
          <>
            {" "}
            — you chose{" "}
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-400 text-text-primary font-bold tile-num mx-1 shadow-sm">
              {heldTile}
            </span>
          </>
        )}
      </p>
      {isHumanTurn && placing && (
        <p className="text-sm text-amber-800 font-medium">
          Now click an empty square on the board
        </p>
      )}
      {isHumanTurn && selecting && (
        <p className="text-xs text-text-muted">
          Step 1 of 2 · then place on the shared grid
        </p>
      )}
      <MatchClock
        enabled={arenaClockEnabled}
        limitSec={arenaMoveLimitSec}
        ply={ply}
        active
      />
      {isHumanTurn && !selecting && phase.kind === "place" && (
        <button
          type="button"
          onClick={onCancelSelect}
          className={cn(
            "text-xs underline text-text-muted hover:text-text-primary",
          )}
        >
          Cancel selection (Esc)
        </button>
      )}
    </div>
  );
}
