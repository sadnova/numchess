import {
  applyAction,
  applyCompoundMove,
  createInitialState,
  getLegalActions,
  pickSearchMove,
  type GameState,
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
  let botMs = 80;
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === "--games") games = Number(process.argv[++i]);
    if (process.argv[i] === "--seed") seed = Number(process.argv[++i]);
    if (process.argv[i] === "--bot-ms") botMs = Number(process.argv[++i]);
  }
  return { games, seed, botMs };
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

function playGame(_rng: () => number, botMs: number): 1 | 2 | "draw" {
  let state = createInitialState();
  while (state.phase.kind !== "ended") {
    if (state.phase.player === 2) {
      const move = pickSearchMove(state, 2, botMs);
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

const { games, seed, botMs } = parseArgs();
const rng = mulberry32(seed);
let p2 = 0;
let p1 = 0;
let draws = 0;

for (let g = 0; g < games; g++) {
  void rng();
  const w = playGame(rng, botMs);
  if (w === 2) p2++;
  else if (w === 1) p1++;
  else draws++;
}

console.log(
  JSON.stringify(
    {
      games,
      seed,
      botMs,
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
