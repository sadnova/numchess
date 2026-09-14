import type { ThreatBand } from "@numchess/engine";
import { cn } from "@/lib/utils";

export const THREAT_BAND_CLASS: Record<ThreatBand, string> = {
  safe: "text-text-muted",
  building: "text-amber-900 bg-amber-100/80",
  threat: "text-orange-900 bg-orange-100/80",
  critical: "text-red-900 bg-red-100/90 font-semibold",
};

export const THREAT_BAND_ICON: Record<ThreatBand, string> = {
  safe: "○",
  building: "◔",
  threat: "◑",
  critical: "!",
};

export function threatBandBadgeClass(band: ThreatBand): string {
  return cn(
    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
    THREAT_BAND_CLASS[band],
  );
}
