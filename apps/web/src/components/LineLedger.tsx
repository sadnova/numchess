import type { GameResult, LineLedgerEntry } from "@numchess/engine";

function LineList({
  title,
  entries,
  accentClass,
}: {
  title: string;
  entries: LineLedgerEntry[];
  accentClass: string;
}) {
  const scored = entries.filter((e) => e.analysis.contributions.length > 0).length;
  return (
    <details className="group rounded-xl border border-border-subtle bg-surface-2/50 open:bg-surface-2">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium list-none flex justify-between items-center gap-2">
        <span>
          <span className={accentClass}>{title}</span>
          <span className="text-text-muted font-normal ml-2">
            {scored}/{entries.length} scoring
          </span>
        </span>
        <span className="text-text-muted group-open:rotate-180 transition text-xs">
          ▼
        </span>
      </summary>
      <ul className="px-4 pb-4 space-y-2 text-xs tile-num max-h-56 overflow-y-auto">
        {entries.map((e) => (
          <li
            key={e.id}
            className="border-t border-border-subtle pt-2 first:border-0 first:pt-0"
          >
            <div className="font-medium text-text-primary">{e.label}</div>
            <div className="text-text-muted mt-0.5">
              R={e.analysis.R} D={e.analysis.D} ·{" "}
              {e.analysis.contributions.length === 0
                ? "no score"
                : e.analysis.contributions
                    .map((c) => `L${c.level} ${c.kind[0]}`)
                    .join(", ")}
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function LineLedger({ result }: { result: GameResult }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text-primary">Full line ledger</h3>
      <p className="text-xs text-text-muted -mt-1">
        Endgame scoring only · labels are informational
      </p>
      <LineList
        title="Player 1"
        accentClass="text-accent-rows"
        entries={result.ledger.player1}
      />
      <LineList
        title="Player 2"
        accentClass="text-accent-cols"
        entries={result.ledger.player2}
      />
    </div>
  );
}
