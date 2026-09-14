import type { GameResult } from "@numchess/engine";
import { Trophy } from "lucide-react";
import { LineLedger } from "@/components/LineLedger";
import { LevelScoreCard } from "@/components/game/LevelScoreCard";
import { PostGameAnalysis } from "@/components/PostGameAnalysis";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function EndScreen({
  result,
  onNewGame,
}: {
  result: GameResult;
  onNewGame: () => void;
}) {
  const isWin = result.outcome === "win";
  const isDraw = result.outcome === "draw";

  return (
    <section
      className="max-w-lg w-full overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 shadow-[var(--shadow-panel)]"
      aria-labelledby="endgame-heading"
    >
      <div
        className={cn(
          "px-6 py-8 text-center",
          isDraw && "bg-surface-2",
          isWin &&
            result.winner === 1 &&
            "bg-gradient-to-b from-accent-rows-soft to-surface-1",
          isWin &&
            result.winner === 2 &&
            "bg-gradient-to-b from-accent-cols-soft to-surface-1",
        )}
      >
        {isWin && (
          <Trophy
            className={cn(
              "h-10 w-10 mx-auto mb-2",
              result.winner === 1 ? "text-accent-rows" : "text-accent-cols",
            )}
            aria-hidden
          />
        )}
        <p className="text-xs uppercase tracking-[0.15em] text-text-muted">
          Game complete
        </p>
        <h2
          id="endgame-heading"
          className="font-display text-3xl font-bold text-text-primary mt-1"
        >
          {isDraw ? "Draw" : `Player ${result.winner} wins`}
        </h2>
        {isWin && (
          <p className="text-sm text-text-muted mt-2">
            Decided at{" "}
            <span className="font-semibold text-amber-800">
              Level {result.decisiveLevel}
            </span>
            {" · "}
            lexicographic compare L5 → L2
          </p>
        )}
      </div>

      <div className="px-6 py-5 space-y-5 border-t border-border-subtle">
        <LevelScoreCard
          levels={result.levels}
          outcome={result.outcome}
          decisiveLevel={isWin ? result.decisiveLevel : undefined}
          winner={isWin ? result.winner : undefined}
        />

        <PostGameAnalysis result={result} />

        <div className="pt-1">
          <LineLedger result={result} />
        </div>

        <Button className="w-full py-2.5 text-base" onClick={onNewGame}>
          Play again
        </Button>
      </div>
    </section>
  );
}
