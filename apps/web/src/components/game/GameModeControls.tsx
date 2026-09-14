import type {
  AppSettings,
  BoardMode,
  BotDifficulty,
  GameMode,
  HumanSeat,
} from "@/lib/persistence";
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

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

function DifficultyRow({
  label,
  value,
  testPrefix,
  onChange,
}: {
  label: string;
  value: BotDifficulty;
  testPrefix: string;
  onChange: (d: BotDifficulty) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <span className="text-text-muted min-w-[4.5rem] text-right">{label}</span>
      {DIFFICULTIES.map((d) => (
        <button
          key={d}
          type="button"
          data-testid={`${testPrefix}-${d}`}
          onClick={() => onChange(d)}
          className={chipToggleClass(value === d)}
        >
          {d}
        </button>
      ))}
    </div>
  );
}

export function GameModeControls({
  boardMode,
  gameMode,
  botDifficulty,
  botP1Difficulty,
  botP2Difficulty,
  humanSeat,
  onBoardModeChange,
  onModeChange,
  onBotDifficulty,
  onBotP1Difficulty,
  onBotP2Difficulty,
  onHumanSeat,
  className,
}: {
  boardMode: BoardMode;
  gameMode: GameMode;
  botDifficulty: AppSettings["botDifficulty"];
  botP1Difficulty: BotDifficulty;
  botP2Difficulty: BotDifficulty;
  humanSeat: HumanSeat;
  onBoardModeChange: (mode: BoardMode) => void;
  onModeChange: (mode: GameMode) => void;
  onBotDifficulty: (d: AppSettings["botDifficulty"]) => void;
  onBotP1Difficulty: (d: BotDifficulty) => void;
  onBotP2Difficulty: (d: BotDifficulty) => void;
  onHumanSeat: (seat: HumanSeat) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className="inline-flex flex-wrap justify-center gap-1 rounded-xl border border-border-subtle bg-surface-2 p-1 max-w-full"
        role="group"
        aria-label="Board mode"
      >
        <button
          type="button"
          aria-pressed={boardMode === "classic"}
          data-testid="board-classic"
          onClick={() => onBoardModeChange("classic")}
          className={segmentTab(boardMode === "classic")}
        >
          Classic
        </button>
        <button
          type="button"
          aria-pressed={boardMode === "strategic"}
          data-testid="board-strategic"
          onClick={() => onBoardModeChange("strategic")}
          className={segmentTab(boardMode === "strategic")}
        >
          Strategic
        </button>
      </div>
      <div
        className="inline-flex flex-wrap justify-center gap-1 rounded-xl border border-border-subtle bg-surface-2 p-1 max-w-full"
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
        <button
          type="button"
          aria-pressed={gameMode === "botSpectator"}
          data-testid="mode-bot-spectator"
          onClick={() => onModeChange("botSpectator")}
          className={segmentTab(gameMode === "botSpectator")}
        >
          Bot vs bot
        </button>
      </div>
      {gameMode === "vsBot" && (
        <div className="flex flex-col items-center gap-2 text-xs">
          <div className="flex gap-1.5" role="group" aria-label="Bot difficulty">
            {DIFFICULTIES.map((d) => (
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
      {gameMode === "botSpectator" && (
        <div className="flex flex-col gap-2 text-xs w-full max-w-xs">
          <DifficultyRow
            label="P1 Rows"
            value={botP1Difficulty}
            testPrefix="bot-p1"
            onChange={onBotP1Difficulty}
          />
          <DifficultyRow
            label="P2 Cols"
            value={botP2Difficulty}
            testPrefix="bot-p2"
            onChange={onBotP2Difficulty}
          />
        </div>
      )}
    </div>
  );
}
