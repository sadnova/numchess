import {
  lineScoreDelta,
  scoreLinesFromBoard,
  type CellValue,
  type LineContribution,
  type Perspective,
} from "@numchess/engine";

export type LineCelebrationEvent = {
  id: string;
  player: 1 | 2;
  level: 4 | 5;
  lineId: string;
  label: string;
  indices: number[];
};

function countLevelContributions(
  contributions: LineContribution[],
  level: 4 | 5,
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
): LineContribution[] {
  const { ledger } = scoreLinesFromBoard(board, perspective);
  return ledger.find((e) => e.id === lineId)?.analysis.contributions ?? [];
}

function filledIndices(indices: number[], board: CellValue[]): number[] {
  return indices.filter((i) => board[i] !== null);
}

function levelFromDelta(
  prev: LineContribution[],
  next: LineContribution[],
): 4 | 5 | null {
  let best: 4 | 5 | null = null;
  for (const level of [4, 5] as const) {
    if (countLevelContributions(next, level) > countLevelContributions(prev, level)) {
      best = level;
    }
  }
  return best;
}

/** Compare boards after a ply; pure function for tests. */
export function celebrationsFromBoards(
  prevBoard: CellValue[],
  nextBoard: CellValue[],
): LineCelebrationEvent[] {
  const delta = lineScoreDelta(prevBoard, nextBoard);
  const out: LineCelebrationEvent[] = [];

  const process = (player: 1 | 2, entries: typeof delta.player1) => {
    const perspective = perspectiveForPlayer(player);
    for (const entry of entries) {
      const prev = prevContributionsForLine(prevBoard, perspective, entry.id);
      const level = levelFromDelta(prev, entry.analysis.contributions);
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
