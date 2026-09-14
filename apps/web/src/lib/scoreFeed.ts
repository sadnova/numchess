import type { LineContribution, LineLedgerEntry } from "@numchess/engine";

export type ScoreFeedEntry = {
  id: string;
  text: string;
};

function formatContribution(c: LineContribution): string {
  const kind = c.kind === "repetition" ? "repetition" : "diversity";
  return `+1 L${c.level} (${kind})`;
}

export function formatLineLockEntry(
  entry: LineLedgerEntry,
  player: 1 | 2,
): ScoreFeedEntry {
  const parts = entry.analysis.contributions.map(formatContribution);
  const side = player === 1 ? "Rows" : "Cols";
  const text =
    parts.length > 0
      ? `${side} · ${entry.label} · ${parts.join(", ")}`
      : `${side} · ${entry.label} · locked`;
  return { id: `${player}-${entry.id}`, text };
}

export function entriesFromLineDelta(delta: {
  player1: LineLedgerEntry[];
  player2: LineLedgerEntry[];
}): ScoreFeedEntry[] {
  const out: ScoreFeedEntry[] = [];
  for (const e of delta.player1) {
    out.push(formatLineLockEntry(e, 1));
  }
  for (const e of delta.player2) {
    out.push(formatLineLockEntry(e, 2));
  }
  return out;
}
