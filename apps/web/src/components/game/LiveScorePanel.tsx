import type { LevelCountsPair } from "@numchess/engine";
import { cn } from "@/lib/utils";

export function LiveScorePanel({
  levels,
  leader,
  decisiveLevel,
  pulseKey,
  tiebreakLevels,
}: {
  levels: LevelCountsPair;
  leader: 1 | 2 | null;
  decisiveLevel: 2 | 3 | 4 | 5 | 6 | null;
  pulseKey?: string;
  tiebreakLevels: readonly (2 | 3 | 4 | 5 | 6)[];
}) {
  return (
    <section
      className="w-full max-w-md rounded-xl border border-border-subtle bg-surface-2/50 px-3 py-2"
      aria-label="Live score from filled lines"
      data-testid="live-score-panel"
    >
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <p className="text-xs font-medium text-text-primary">Live score</p>
        <p className="text-[10px] text-text-muted">Updates each turn</p>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 text-[10px] uppercase tracking-wide text-text-muted mb-1">
        <span className="text-accent-rows text-right">Rows</span>
        <span className="text-center">Lv</span>
        <span className="text-accent-cols">Cols</span>
      </div>
      {tiebreakLevels.map((lv) => (
        <div
          key={lv}
          className={cn(
            "grid grid-cols-[1fr_auto_1fr] gap-x-2 text-sm tile-num tabular-nums py-0.5",
            pulseKey?.includes(`L${lv}`) && "animate-pulse",
          )}
        >
          <span
            className={cn(
              "text-right font-semibold",
              leader === 1 && decisiveLevel === lv
                ? "text-accent-rows"
                : "text-text-primary",
            )}
          >
            {levels.rows[lv]}
          </span>
          <span className="text-center text-xs text-text-muted">L{lv}</span>
          <span
            className={cn(
              "font-semibold",
              leader === 2 && decisiveLevel === lv
                ? "text-accent-cols"
                : "text-text-primary",
            )}
          >
            {levels.columns[lv]}
          </span>
        </div>
      ))}
      {leader !== null && decisiveLevel !== null && (
        <p className="text-[11px] text-text-muted mt-1 text-center">
          {leader === 1 ? "Rows" : "Cols"} lead at L{decisiveLevel}
        </p>
      )}
    </section>
  );
}
