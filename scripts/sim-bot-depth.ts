import {
  applyCompoundMove,
  createInitialState,
  searchBestMove,
  type GameState,
  type PlayerId,
  type SearchOptions,
} from "@numchess/engine";

function parseArgs() {
  let games = 30;
  let seed = 42;
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === "--games") games = Number(process.argv[++i]);
    if (process.argv[i] === "--seed") seed = Number(process.argv[++i]);
  }
  return { games, seed };
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

const deep: SearchOptions = {
  timeMs: 2000,
  maxDepth: 10,
  useTranspositionTable: true,
};
const shallow: SearchOptions = {
  timeMs: 50,
  maxDepth: 2,
  useTranspositionTable: false,
};

function playGame(deepSeat: PlayerId): 1 | 2 | "draw" {
  let state = createInitialState();
  while (state.phase.kind !== "ended") {
    const p = state.phase.player;
    const move = searchBestMove(
      state,
      p,
      p === deepSeat ? deep : shallow,
    );
    if (!move) break;
    const next = applyCompoundMove(state, move);
    if (!next) break;
    state = next;
  }
  if (state.phase.kind !== "ended") return "draw";
  return state.phase.result.outcome === "draw"
    ? "draw"
    : state.phase.result.winner;
}

const { games, seed } = parseArgs();
const rng = mulberry32(seed);
let deepWins = 0;
let shallowWins = 0;
let draws = 0;

for (let g = 0; g < games; g++) {
  void rng();
  const deepSeat: PlayerId = g % 2 === 0 ? 1 : 2;
  const w = playGame(deepSeat);
  if (w === "draw") draws++;
  else if (w === deepSeat) deepWins++;
  else shallowWins++;
}

console.log(
  JSON.stringify(
    {
      games,
      seed,
      deepSeatAlternating: true,
      deepWins,
      shallowWins,
      draws,
      deepWinRate: deepWins / games,
    },
    null,
    2,
  ),
);
