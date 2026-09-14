import type { ScoreFeedEntry } from "@/lib/scoreFeed";

export function ScoreFeed({ entries }: { entries: ScoreFeedEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <ul
      className="w-full max-w-md space-y-1 text-xs text-text-muted"
      aria-label="Recent line locks"
    >
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
  );
}
