export interface SearchContext {
  startMs: number;
  timeMs: number;
  fastDeadline: number;
  hardDeadline: number;
}

export function createSearchContext(
  timeMs: number,
  fastShare = 0.35,
): SearchContext {
  const startMs = Date.now();
  return {
    startMs,
    timeMs,
    fastDeadline: startMs + timeMs * fastShare,
    hardDeadline: startMs + timeMs,
  };
}

export function timeRemaining(ctx: SearchContext): number {
  return Math.max(0, ctx.hardDeadline - Date.now());
}

export function fastPhaseExpired(ctx: SearchContext): boolean {
  return Date.now() >= ctx.fastDeadline;
}

export function shouldAbort(ctx: SearchContext): boolean {
  return Date.now() >= ctx.hardDeadline;
}
