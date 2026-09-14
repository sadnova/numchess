import type { GameResult } from "@numchess/engine";

function tiebreakLabel(
  levels: readonly (2 | 3 | 4 | 5 | 6)[],
): string {
  return levels.map((l) => `L${l}`).join("→");
}

export function PostGameAnalysis({
  result,
  tiebreakLevels,
}: {
  result: GameResult;
  tiebreakLevels: readonly (2 | 3 | 4 | 5 | 6)[];
}) {
  const { levels } = result;
  const band = tiebreakLabel(tiebreakLevels);
  const explanation =
    result.outcome === "draw"
      ? `All compared levels (${band}) are tied.`
      : `Player ${result.winner} leads at Level ${result.decisiveLevel} (rows ${levels.rows[result.decisiveLevel]} vs columns ${levels.columns[result.decisiveLevel]}).`;

  const topP1 = [...result.ledger.player1]
    .filter((e) => e.analysis.contributions.length > 0)
    .slice(0, 3);
  const topP2 = [...result.ledger.player2]
    .filter((e) => e.analysis.contributions.length > 0)
    .slice(0, 3);

  return (
    <div className="text-sm space-y-3 rounded-xl border border-border-subtle bg-surface-1 p-4">
      <div>
        <h3 className="font-semibold text-text-primary">Why this result</h3>
        <p className="text-text-muted mt-1 leading-relaxed">{explanation}</p>
      </div>
      {(topP1.length > 0 || topP2.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs tile-num border-t border-border-subtle pt-3">
          <div>
            <p className="text-accent-rows font-medium mb-1.5">Top P1 lines</p>
            <ul className="space-y-1.5 text-text-primary">
              {topP1.length === 0 ? (
                <li className="text-text-muted">—</li>
              ) : (
                topP1.map((e) => (
                  <li key={e.id}>
                    <span className="text-text-muted">{e.label}: </span>
                    {e.analysis.contributions
                      .map((c) => `L${c.level}${c.kind[0]}`)
                      .join(", ")}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <p className="text-accent-cols font-medium mb-1.5">Top P2 lines</p>
            <ul className="space-y-1.5 text-text-primary">
              {topP2.length === 0 ? (
                <li className="text-text-muted">—</li>
              ) : (
                topP2.map((e) => (
                  <li key={e.id}>
                    <span className="text-text-muted">{e.label}: </span>
                    {e.analysis.contributions
                      .map((c) => `L${c.level}${c.kind[0]}`)
                      .join(", ")}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
