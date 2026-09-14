export interface SearchOptions {
  timeMs?: number;
  maxDepth?: number;
  searchTopK?: number;
  childTopK?: number;
  quiescenceDepth?: number;
  endgameEmptyThreshold?: number;
  easyNoise?: boolean;
  easyTopK?: number;
  useTranspositionTable?: boolean;
  /** @deprecated ignored in v3 selector */
  fastEvalAtDepth?: boolean;
}
