import type { LineInsight } from "@numchess/engine";
import { threatBandBadgeClass, THREAT_BAND_ICON } from "@/lib/threatStyles";
import { cn } from "@/lib/utils";

type OverlaySettings = {
  showRowOverlays: boolean;
  showColOverlays: boolean;
  showDiagOverlays: boolean;
};

export function LineInsightsPanel({
  insights,
  overlaySettings,
  onOverlayChange,
  onHighlightLine,
}: {
  insights: LineInsight[];
  overlaySettings: OverlaySettings;
  onOverlayChange: (patch: Partial<OverlaySettings>) => void;
  onHighlightLine: (lineId: string | null) => void;
}) {
  if (insights.length === 0) return null;

  return (
    <aside
      className="w-full max-w-md rounded-xl border border-border-subtle bg-surface-1 p-3 shadow-sm text-xs"
      aria-label="Line insights"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="font-semibold text-text-primary text-sm">Your lines</h2>
        <p className="text-text-muted">Partial R/D · heuristic</p>
      </div>
      <div className="flex flex-wrap gap-3 mb-3 text-text-muted pb-2 border-b border-border-subtle">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={overlaySettings.showRowOverlays}
            onChange={(e) =>
              onOverlayChange({ showRowOverlays: e.target.checked })
            }
          />
          Rows
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={overlaySettings.showColOverlays}
            onChange={(e) =>
              onOverlayChange({ showColOverlays: e.target.checked })
            }
          />
          Cols
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={overlaySettings.showDiagOverlays}
            onChange={(e) =>
              onOverlayChange({ showDiagOverlays: e.target.checked })
            }
          />
            Diags (lines on board)
        </label>
      </div>
      <ul className="space-y-1 max-h-48 overflow-y-auto">
        {insights.map((line) => (
          <li key={line.lineId}>
            <button
              type="button"
              onMouseEnter={() => onHighlightLine(line.lineId)}
              onMouseLeave={() => onHighlightLine(null)}
              onFocus={() => onHighlightLine(line.lineId)}
              onBlur={() => onHighlightLine(null)}
              className={cn(
                "w-full flex items-center justify-between gap-2 text-left rounded-lg px-2 py-1.5",
                "hover:bg-surface-2 transition-colors",
              )}
            >
              <span className="text-text-primary truncate">{line.label}</span>
              <span className="flex items-center gap-2 shrink-0 tile-num">
                <span className="text-text-muted">
                  {line.filled}/{line.lineLength} · R{line.analysis.R} D
                  {line.analysis.D}
                </span>
                <span
                  className={threatBandBadgeClass(line.band)}
                  title={line.band}
                >
                  <span aria-hidden>{THREAT_BAND_ICON[line.band]}</span>
                  {line.band}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
