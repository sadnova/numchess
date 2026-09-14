import {
  applyCompoundMove,
  chooseBotMove,
  createInitialState,
  searchOptionsForDifficulty,
  type GameState,
  type PlayerId,
} from "@numchess/engine";

function parseArgs() {
  let games = 50;
  let seed = 42;
  let p1Level: "easy" | "medium" | "hard" = "hard";
  let p2Level: "easy" | "medium" | "hard" = "medium";
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === "--games") games = Number(process.argv[++i]);
    if (process.argv[i] === "--seed") seed = Number(process.argv[++i]);
    if (process.argv[i] === "--p1") p1Level = process.argv[++i] as typeof p1Level;
    if (process.argv[i] === "--p2") p2Level = process.argv[++i] as typeof p2Level;
  }
  return { games, seed, p1Level, p2Level };
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

const { games, seed, p1Level, p2Level } = parseArgs();
const optsP1 = searchOptionsForDifficulty(p1Level);
const optsP2 = searchOptionsForDifficulty(p2Level);

function botMove(state: GameState, player: PlayerId) {
  const opts = player === 1 ? optsP1 : optsP2;
  return chooseBotMove(state, player, opts);
}

function playGame(): 1 | 2 | "draw" {
  let state = createInitialState();
  while (state.phase.kind !== "ended") {
    const p = state.phase.player;
    const move = botMove(state, p);
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

const rng = mulberry32(seed);
let p1 = 0;
let p2 = 0;
let draws = 0;

for (let g = 0; g < games; g++) {
  void rng();
  const w = playGame();
  if (w === 1) p1++;
  else if (w === 2) p2++;
  else draws++;
}

console.log(
  JSON.stringify(
    {
      games,
      seed,
      p1Level,
      p2Level,
      p1Wins: p1,
      p2Wins: p2,
      draws,
      p1WinRate: p1 / games,
    },
    null,
    2,
  ),
);
