import type { LevelCountsPair } from "@numchess/engine";
import { cn } from "@/lib/utils";

export function LevelScoreCard({
  levels,
  tiebreakLevels,
  decisiveLevel,
  outcome,
  winner,
}: {
  levels: LevelCountsPair;
  tiebreakLevels: readonly (2 | 3 | 4 | 5 | 6)[];
  decisiveLevel?: 2 | 3 | 4 | 5 | 6;
  outcome: "win" | "draw";
  winner?: 1 | 2;
}) {
  const max = Math.max(
    ...tiebreakLevels.flatMap((lv) => [levels.rows[lv], levels.columns[lv]]),
    1,
  );

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-2/60 p-4 space-y-3">
      <div className="flex justify-between text-xs font-medium uppercase tracking-wide text-text-muted">
        <span className="text-accent-rows">Rows (P1)</span>
        <span>Level</span>
        <span className="text-accent-cols">Cols (P2)</span>
      </div>
      {tiebreakLevels.map((lv) => {
        const r = levels.rows[lv];
        const c = levels.columns[lv];
        const isDecisive = outcome === "win" && decisiveLevel === lv;
        const rowWins = outcome === "win" && winner === 1 && isDecisive;
        const colWins = outcome === "win" && winner === 2 && isDecisive;
        return (
          <div key={lv} className="space-y-1">
            <div className="flex items-center gap-2 text-sm tile-num">
              <span
                className={cn(
                  "w-8 text-right font-semibold tabular-nums",
                  rowWins ? "text-accent-rows" : "text-text-primary",
                )}
              >
                {r}
              </span>
              <span
                className={cn(
                  "flex-1 text-center text-xs font-medium",
                  isDecisive ? "text-amber-800" : "text-text-muted",
                )}
              >
                L{lv}
                {isDecisive && " ★"}
              </span>
              <span
                className={cn(
                  "w-8 font-semibold tabular-nums",
                  colWins ? "text-accent-cols" : "text-text-primary",
                )}
              >
                {c}
              </span>
            </div>
            <div className="flex gap-1 h-2">
              <div
                className={cn(
                  "h-full rounded-l-full bg-accent-rows/70 transition-all",
                  rowWins && "ring-1 ring-accent-rows",
                )}
                style={{ width: `${(r / max) * 50}%`, minWidth: r > 0 ? "4px" : 0 }}
              />
              <div className="flex-1 min-w-[8px]" />
              <div
                className={cn(
                  "h-full rounded-r-full bg-accent-cols/70 transition-all ml-auto",
                  colWins && "ring-1 ring-accent-cols",
                )}
                style={{ width: `${(c / max) * 50}%`, minWidth: c > 0 ? "4px" : 0 }}
              />
            </div>
          </div>
        );
      })}
      {outcome === "draw" && (
        <p className="text-xs text-center text-text-muted pt-1">
          All compared levels tied — official draw.
        </p>
      )}
    </div>
  );
}
