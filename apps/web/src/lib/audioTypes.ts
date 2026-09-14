import type { LineContribution } from "@numchess/engine";

export type SfxId =
  | "select"
  | "place"
  | "line_lock"
  | "level_4"
  | "level_5"
  | "level_5_celebrate"
  | "lead_change"
  | "end_win"
  | "end_draw"
  | "end_loss"
  | "undo"
  | "error";

type ManifestSource = {
  src: string[];
  volume?: number;
  interrupt?: boolean;
};

export type AudioManifest = {
  version: number;
  sources: Record<SfxId, ManifestSource>;
};

export function maxContributionLevel(
  contributions: LineContribution[],
): 2 | 3 | 4 | 5 | 6 | null {
  if (contributions.length === 0) return null;
  return contributions.reduce(
    (max, c) => (c.level > max ? c.level : max),
    contributions[0]!.level,
  );
}
