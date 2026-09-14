import {
  DEFAULT_GAME_CONFIG,
  lineScoreDelta,
  scoreLinesFromBoard,
  type CellValue,
  type GameConfig,
  type LineContribution,
  type Perspective,
} from "@numchess/engine";

export type CelebrationLevel = 4 | 5 | 6;

export type LineCelebrationEvent = {
  id: string;
  player: 1 | 2;
  level: CelebrationLevel;
  lineId: string;
  label: string;
  indices: number[];
};

function celebrationLevelsFor(config: GameConfig): CelebrationLevel[] {
  const raw = config.scoring.celebrationLevels ?? [4, 5];
  const out: CelebrationLevel[] = [];
  for (const n of raw) {
    if (n === 4 || n === 5 || n === 6) out.push(n);
  }
  return out.length > 0 ? out : [4, 5];
}

function countLevelContributions(
  contributions: LineContribution[],
  level: CelebrationLevel,
): number {
  return contributions.filter((c) => c.level === level).length;
}

function perspectiveForPlayer(player: 1 | 2): Perspective {
  return player === 1 ? "rows" : "columns";
}

function prevContributionsForLine(
  board: CellValue[],
  perspective: Perspective,
  lineId: string,
  config: GameConfig,
): LineContribution[] {
  const { ledger } = scoreLinesFromBoard(board, perspective, config);
  return ledger.find((e) => e.id === lineId)?.analysis.contributions ?? [];
}

function filledIndices(indices: number[], board: CellValue[]): number[] {
  return indices.filter((i) => board[i] !== null);
}

function levelFromDelta(
  prev: LineContribution[],
  next: LineContribution[],
  levels: CelebrationLevel[],
): CelebrationLevel | null {
  let best: CelebrationLevel | null = null;
  for (const level of levels) {
    if (countLevelContributions(next, level) > countLevelContributions(prev, level)) {
      if (best === null || level > best) best = level;
    }
  }
  return best;
}

/** Compare boards after a ply; pure function for tests. */
export function celebrationsFromBoards(
  prevBoard: CellValue[],
  nextBoard: CellValue[],
  config: GameConfig = DEFAULT_GAME_CONFIG,
): LineCelebrationEvent[] {
  const delta = lineScoreDelta(prevBoard, nextBoard, config);
  const celebrateLevels = celebrationLevelsFor(config);
  const out: LineCelebrationEvent[] = [];

  const process = (player: 1 | 2, entries: typeof delta.player1) => {
    const perspective = perspectiveForPlayer(player);
    for (const entry of entries) {
      const prev = prevContributionsForLine(
        prevBoard,
        perspective,
        entry.id,
        config,
      );
      const level = levelFromDelta(
        prev,
        entry.analysis.contributions,
        celebrateLevels,
      );
      if (level === null) continue;
      const indices = filledIndices(entry.indices, nextBoard);
      if (indices.length === 0) continue;
      out.push({
        id: `${player}-${entry.id}-L${level}`,
        player,
        level,
        lineId: entry.id,
        label: entry.label,
        indices,
      });
    }
  };

  process(1, delta.player1);
  process(2, delta.player2);
  return out;
}

export function topCelebrationLevel(
  events: LineCelebrationEvent[],
): CelebrationLevel | null {
  if (events.length === 0) return null;
  return events.reduce<CelebrationLevel>(
    (acc, e) => (e.level > acc ? e.level : acc),
    events[0]!.level,
  );
}

export function isTopTierCelebration(
  level: CelebrationLevel,
  config: GameConfig,
): boolean {
  const levels = celebrationLevelsFor(config);
  const top = Math.max(...levels);
  return level >= top - 1 && level >= 5;
}
