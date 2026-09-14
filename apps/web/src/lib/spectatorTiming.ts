import type { CelebrationLevel } from "@/lib/lineCelebration";

export const CELEBRATION_HOLD_MS = 900;
export const CELEBRATION_HOLD_MS_L5 = 1300;
export const CELEBRATION_HOLD_MS_L6 = 1500;
export const VS_BOT_CELEBRATION_CAP_MS = 600;
export const SPECTATOR_PACE_NORMAL_MS = 400;
export const SPECTATOR_PACE_SLOW_MS = 800;

export function celebrationHoldForLevel(
  maxLevel: CelebrationLevel | null,
  reduceMotion: boolean,
): number {
  if (reduceMotion || maxLevel === null) return 0;
  if (maxLevel === 6) return CELEBRATION_HOLD_MS_L6;
  if (maxLevel === 5) return CELEBRATION_HOLD_MS_L5;
  return CELEBRATION_HOLD_MS;
}
