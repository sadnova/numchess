import {
  applyAction,
  createInitialState,
  getLegalActions,
  type GameState,
} from "@numchess/engine";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function step(state: GameState): GameState {
  const legal = getLegalActions(state);
  const action = pickRandom(legal);
  if (action.type === "SELECT") {
    return applyAction(state, { type: "SELECT", value: action.value }).value!;
  }
  return applyAction(state, { type: "PLACE", index: action.index }).value!;
}

function parseArgs() {
  let games = 500;
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

const { games, seed } = parseArgs();
const rand = mulberry32(seed);
const originalRandom = Math.random;
Math.random = rand;

let p1Wins = 0;
let p2Wins = 0;
let draws = 0;

for (let g = 0; g < games; g++) {
  let s = createInitialState();
  while (s.phase.kind !== "ended") {
    s = step(s);
  }
  if (s.phase.kind !== "ended") continue;
  const result = s.phase.result;
  if (result.outcome === "draw") draws++;
  else if (result.winner === 1) p1Wins++;
  else p2Wins++;
}

Math.random = originalRandom;

console.log(
  JSON.stringify(
    {
      games,
      seed,
      p1Wins,
      p2Wins,
      draws,
      p1WinRate: p1Wins / games,
      drawRate: draws / games,
    },
    null,
    2,
  ),
);
