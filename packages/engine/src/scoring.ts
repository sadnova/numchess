import { CELL_COUNT } from "./constants.js";
import { getFilledLineCells, getLineCells, getScoringLines } from "./lines.js";
import { addContributions, analyzeLine, emptyLevelCounts } from "./patterns.js";
import type {
  CellValue,
  GameState,
  LevelCounts,
  LevelCountsPair,
  LineContribution,
  LineLedgerEntry,
  Perspective,
  PlayerId,
} from "./types.js";
import { compareLevelCounts } from "./winner.js";

export function isLineComplete(board: CellValue[], indices: number[]): boolean {
  if (indices.length !== 6) return false;
  for (const i of indices) {
    if (board[i] === null) return false;
  }
  return true;
}

function scoreCompletedPerspective(
  board: CellValue[],
  perspective: Perspective,
): { counts: LevelCounts; ledger: LineLedgerEntry[]; completeLineIds: string[] } {
  const counts = emptyLevelCounts();
  const ledger: LineLedgerEntry[] = [];
  const completeLineIds: string[] = [];
  for (const line of getScoringLines(perspective)) {
    if (!isLineComplete(board, line.indices)) continue;
    const cells = getLineCells(board, line.indices);
    if (cells.length !== 6) continue;
    const analysis = analyzeLine(cells);
    addContributions(counts, analysis.contributions);
    ledger.push({
      id: line.id,
      label: line.label,
      indices: line.indices,
      analysis,
    });
    completeLineIds.push(line.id);
  }
  return { counts, ledger, completeLineIds };
}

export function scoreCompletedLines(state: GameState): {
  levels: LevelCountsPair;
  ledger: { player1: LineLedgerEntry[]; player2: LineLedgerEntry[] };
  completeLineIds: { rows: string[]; columns: string[] };
} {
  const p1 = scoreCompletedPerspective(state.board, "rows");
  const p2 = scoreCompletedPerspective(state.board, "columns");
  return {
    levels: { rows: p1.counts, columns: p2.counts },
    ledger: { player1: p1.ledger, player2: p2.ledger },
    completeLineIds: { rows: p1.completeLineIds, columns: p2.completeLineIds },
  };
}

function newlyCompletedEntries(
  prevBoard: CellValue[],
  nextBoard: CellValue[],
  perspective: Perspective,
): LineLedgerEntry[] {
  const entries: LineLedgerEntry[] = [];
  for (const line of getScoringLines(perspective)) {
    if (
      isLineComplete(prevBoard, line.indices) ||
      !isLineComplete(nextBoard, line.indices)
    ) {
      continue;
    }
    const cells = getLineCells(nextBoard, line.indices);
    if (cells.length !== 6) continue;
    const analysis = analyzeLine(cells);
    entries.push({
      id: line.id,
      label: line.label,
      indices: line.indices,
      analysis,
    });
  }
  return entries;
}

export function linesNewlyCompleted(
  prevBoard: CellValue[],
  nextBoard: CellValue[],
): { player1: LineLedgerEntry[]; player2: LineLedgerEntry[] } {
  return {
    player1: newlyCompletedEntries(prevBoard, nextBoard, "rows"),
    player2: newlyCompletedEntries(prevBoard, nextBoard, "columns"),
  };
}

export function liveScoreLeader(levels: LevelCountsPair): {
  leader: 1 | 2 | null;
  decisiveLevel: 2 | 3 | 4 | 5 | null;
} {
  const { winner, decisiveLevel } = compareLevelCounts(
    levels.rows,
    levels.columns,
  );
  return { leader: winner, decisiveLevel };
}

function contributionKey(contributions: LineContribution[]): string {
  return contributions
    .map((c) => `${c.level}-${c.kind}`)
    .sort()
    .join("|");
}

export function scoreLinesFromBoard(
  board: CellValue[],
  perspective: Perspective,
): { counts: LevelCounts; ledger: LineLedgerEntry[] } {
  const counts = emptyLevelCounts();
  const ledger: LineLedgerEntry[] = [];
  for (const line of getScoringLines(perspective)) {
    const cells = getFilledLineCells(board, line.indices);
    if (cells.length === 0) continue;
    const analysis = analyzeLine(cells);
    addContributions(counts, analysis.contributions);
    ledger.push({
      id: line.id,
      label: line.label,
      indices: line.indices,
      analysis,
    });
  }
  return { counts, ledger };
}

export function scoreLiveLevels(state: GameState): LevelCountsPair {
  const rows = scoreLinesFromBoard(state.board, "rows");
  const columns = scoreLinesFromBoard(state.board, "columns");
  return { rows: rows.counts, columns: columns.counts };
}

function ledgerMap(
  board: CellValue[],
  perspective: Perspective,
): Map<string, LineLedgerEntry> {
  const { ledger } = scoreLinesFromBoard(board, perspective);
  return new Map(ledger.map((e) => [e.id, e]));
}

function deltaForPerspective(
  prevBoard: CellValue[],
  nextBoard: CellValue[],
  perspective: Perspective,
): LineLedgerEntry[] {
  const prev = ledgerMap(prevBoard, perspective);
  const next = ledgerMap(nextBoard, perspective);
  const entries: LineLedgerEntry[] = [];
  for (const [id, nextEntry] of next) {
    const prevKey = contributionKey(prev.get(id)?.analysis.contributions ?? []);
    const nextKey = contributionKey(nextEntry.analysis.contributions);
    if (nextKey !== prevKey && nextKey.length > 0) {
      entries.push(nextEntry);
    }
  }
  return entries;
}

/** Lines whose R/D contributions changed between boards (partial or complete). */
export function lineScoreDelta(
  prevBoard: CellValue[],
  nextBoard: CellValue[],
): { player1: LineLedgerEntry[]; player2: LineLedgerEntry[] } {
  return {
    player1: deltaForPerspective(prevBoard, nextBoard, "rows"),
    player2: deltaForPerspective(prevBoard, nextBoard, "columns"),
  };
}

function perspectiveForPlayer(player: PlayerId): Perspective {
  return player === 1 ? "rows" : "columns";
}

export function scorePerspective(
  board: CellValue[],
  perspective: Perspective,
): { counts: LevelCounts; ledger: LineLedgerEntry[] } {
  const counts = emptyLevelCounts();
  const ledger: LineLedgerEntry[] = [];
  for (const line of getScoringLines(perspective)) {
    const cells = getLineCells(board, line.indices);
    if (cells.length !== 6) {
      throw new Error(`Line ${line.id} incomplete at scoring time`);
    }
    const analysis = analyzeLine(cells);
    addContributions(counts, analysis.contributions);
    ledger.push({
      id: line.id,
      label: line.label,
      indices: line.indices,
      analysis,
    });
  }
  return { counts, ledger };
}

export function scorePlayer(state: GameState, player: PlayerId): LevelCounts {
  const perspective = perspectiveForPlayer(player);
  return scorePerspective(state.board, perspective).counts;
}

export function scoreBoth(state: GameState): LevelCountsPair {
  const p1 = scorePerspective(state.board, "rows");
  const p2 = scorePerspective(state.board, "columns");
  return { rows: p1.counts, columns: p2.counts };
}

export function buildLedger(state: GameState): {
  player1: LineLedgerEntry[];
  player2: LineLedgerEntry[];
} {
  return {
    player1: scorePerspective(state.board, "rows").ledger,
    player2: scorePerspective(state.board, "columns").ledger,
  };
}

export function isBoardFull(board: CellValue[]): boolean {
  return board.every((c) => c !== null);
}

export function assertBoardFullForScoring(board: CellValue[]): void {
  if (!isBoardFull(board)) {
    throw new Error("Scoring requires a full board");
  }
  if (board.length !== CELL_COUNT) {
    throw new Error("Invalid board length");
  }
}

export function evaluateGame(state: GameState) {
  assertBoardFullForScoring(state.board);
  const levels = scoreBoth(state);
  const ledger = buildLedger(state);
  return { levels, ledger };
}
