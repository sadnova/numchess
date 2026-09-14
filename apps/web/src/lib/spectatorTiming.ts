export const CELEBRATION_HOLD_MS = 900;
export const CELEBRATION_HOLD_MS_L5 = 1300;
export const VS_BOT_CELEBRATION_CAP_MS = 600;
export const SPECTATOR_PACE_NORMAL_MS = 400;
export const SPECTATOR_PACE_SLOW_MS = 800;

export function celebrationHoldForLevel(
  maxLevel: 4 | 5 | null,
  reduceMotion: boolean,
): number {
  if (reduceMotion || maxLevel === null) return 0;
  return maxLevel === 5 ? CELEBRATION_HOLD_MS_L5 : CELEBRATION_HOLD_MS;
}
