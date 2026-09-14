export {
  BOARD_SIZE,
  CELL_COUNT,
  DEFAULT_GAME_CONFIG,
  GLOBAL_BOARD_TOTALS,
  RULES_VERSION,
  STARTING_INVENTORY,
  TILE_VALUES,
  type GameConfig,
  type GameVariant,
  type TileValue,
} from "./constants.js";
export {
  analyzePartialLine,
  analyzePositionForPlayer,
  cancelSelection,
  canReachL5OnLine,
  classifyLineBand,
  combinedInventoryCounts,
} from "./analysis.js";
export type { LineInsight, ThreatBand } from "./analysis.js";
export { getFilledLineCells, getLineCells, getScoringLines, indexToRowCol, rowColToIndex } from "./lines.js";
export {
  addContributions,
  analyzeLine,
  emptyLevelCounts,
} from "./patterns.js";
export {
  assertBoardFullForScoring,
  buildLedger,
  evaluateGame,
  isBoardFull,
  isLineComplete,
  lineScoreDelta,
  linesNewlyCompleted,
  liveScoreLeader,
  scoreBoth,
  scoreCompletedLines,
  scoreLinesFromBoard,
  scoreLiveLevels,
  scorePlayer,
  scorePerspective,
} from "./scoring.js";
export {
  applyAction,
  applyActionOrThrow,
  createInitialState,
  currentPlayer,
  getLegalActions,
} from "./state.js";
export type {
  CellValue,
  GameAction,
  GameResult,
  GameState,
  IllegalMoveReason,
  Inventory,
  LegalAction,
  LevelCounts,
  LevelCountsPair,
  LineAnalysis,
  LineContribution,
  LineLedgerEntry,
  Perspective,
  Phase,
  PlayerId,
  Result,
} from "./types.js";
export { err, ok } from "./types.js";
export { compareLevelCounts, resolveWinner } from "./winner.js";
export {
  createInitialStateWithFirstPlayer,
  createSandboxState,
} from "./fixtures.js";
export {
  applyCompoundMove,
  contributionDeltaScore,
  evalInsightTerms,
  evalLiveLevelDiff,
  evaluatePosition,
  getLegalCompoundMoves,
  chooseBotMove,
  pickSearchMove,
  searchBestMove,
  searchOptionsForDifficulty,
  type CompoundMove,
  type SearchOptions,
} from "./ai.js";
