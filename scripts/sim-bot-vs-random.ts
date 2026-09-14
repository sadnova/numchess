import {
  applyAction,
  applyCompoundMove,
  chooseBotMove,
  configForBoardMode,
  createInitialState,
  getLegalActions,
  RULES_VERSION,
  RULES_VERSION_STRATEGIC,
  searchOptionsForDifficulty,
  type BoardMode,
  type GameState,
  type SearchOptions,
} from "@numchess/engine";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomCompoundMove(state: GameState) {
  if (state.phase.kind !== "select") return null;
  const sel = pickRandom(
    getLegalActions(state).filter((a) => a.type === "SELECT"),
  );
  if (sel.type !== "SELECT") return null;
  const mid = applyAction(state, { type: "SELECT", value: sel.value });
  if (!mid.ok) return null;
  const pl = pickRandom(
    getLegalActions(mid.value).filter((a) => a.type === "PLACE"),
  );
  if (pl.type !== "PLACE") return null;
  return { select: sel.value, place: pl.index };
}

function parseArgs() {
  let games = 50;
  let seed = 42;
  let botMs: number | undefined = undefined;
  let difficulty: "easy" | "medium" | "hard" = "medium";
  let boardMode: BoardMode = "classic";
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === "--games") games = Number(process.argv[++i]);
    if (process.argv[i] === "--seed") seed = Number(process.argv[++i]);
    if (process.argv[i] === "--bot-ms") botMs = Number(process.argv[++i]);
    if (process.argv[i] === "--difficulty") {
      difficulty = process.argv[++i] as "easy" | "medium" | "hard";
    }
    if (process.argv[i] === "--board") {
      const v = process.argv[++i];
      boardMode = v === "strategic" ? "strategic" : "classic";
    }
  }
  return { games, seed, botMs, difficulty, boardMode };
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function playGame(
  _rng: () => number,
  botOptions: SearchOptions,
  boardMode: BoardMode,
): 1 | 2 | "draw" {
  let state = createInitialState(configForBoardMode(boardMode));
  while (state.phase.kind !== "ended") {
    if (state.phase.player === 2) {
      const move = chooseBotMove(state, 2, botOptions);
      if (!move) break;
      const next = applyCompoundMove(state, move);
      if (!next) break;
      state = next;
    } else {
      const move = randomCompoundMove(state);
      if (!move) break;
      const next = applyCompoundMove(state, move);
      if (!next) break;
      state = next;
    }
  }
  if (state.phase.kind !== "ended") return "draw";
  return state.phase.result.outcome === "draw"
    ? "draw"
    : state.phase.result.winner;
}

const { games, seed, botMs, difficulty, boardMode } = parseArgs();
const base = searchOptionsForDifficulty(difficulty, boardMode);
const botOptions: SearchOptions = {
  ...base,
  ...(botMs !== undefined ? { timeMs: botMs } : {}),
};
const rng = mulberry32(seed);
let p2 = 0;
let p1 = 0;
let draws = 0;

for (let g = 0; g < games; g++) {
  void rng();
  const w = playGame(rng, botOptions, boardMode);
  if (w === 2) p2++;
  else if (w === 1) p1++;
  else draws++;
  if (games >= 10 && (g + 1) % 10 === 0) {
    console.error(`sim:bot progress ${g + 1}/${games}`);
  }
}

console.log(
  JSON.stringify(
    {
      rulesVersion:
        boardMode === "strategic" ? RULES_VERSION_STRATEGIC : RULES_VERSION,
      boardMode,
      games,
      seed,
      difficulty,
      botMs: botOptions.timeMs,
      maxDepth: botOptions.maxDepth,
      botSeat: 2,
      botWins: p2,
      randomWins: p1,
      draws,
      botWinRate: p2 / games,
    },
    null,
    2,
  ),
);
