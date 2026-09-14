import type { ScoreFeedEntry } from "@/lib/scoreFeed";

export function ScoreFeed({ entries }: { entries: ScoreFeedEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div
      className="w-full max-w-lg mx-auto max-h-28 overflow-y-auto overscroll-contain rounded-lg border border-border-subtle/60 bg-surface-2/30 px-1 py-1"
      aria-label="Recent scoring updates"
    >
      <ul className="space-y-1 text-xs text-text-muted">
        {entries.map((e, i) => (
          <li
            key={e.id}
            className="rounded-md bg-surface-2/40 px-2 py-1 border border-border-subtle/60"
            aria-live={i === 0 ? "polite" : undefined}
          >
            {e.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
