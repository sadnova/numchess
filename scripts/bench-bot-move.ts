import {
  chooseBotMove,
  createInitialState,
  createSandboxState,
  searchOptionsForDifficulty,
} from "@numchess/engine";

const FIXTURES: { name: string; state: ReturnType<typeof createInitialState> }[] =
  [
    { name: "opening", state: createInitialState() },
    { name: "mid", state: createSandboxState() },
  ];

function parseArgs() {
  let iterations = 20;
  let smoke = false;
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === "--iter") iterations = Number(process.argv[++i]);
    if (process.argv[i] === "--smoke") smoke = true;
  }
  return { iterations, smoke };
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)] ?? 0;
}

const { iterations, smoke } = parseArgs();
const opts = searchOptionsForDifficulty("medium");
const results: Record<string, { p50: number; p95: number; n: number }> = {};

function fixturePlayer(state: ReturnType<typeof createInitialState>): 1 | 2 {
  const p = state.phase;
  if (p.kind === "ended") return 1;
  return p.player;
}

for (const { name, state } of FIXTURES) {
  if (state.phase.kind === "ended") continue;
  const player = fixturePlayer(state);
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    chooseBotMove(state, player, opts);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  results[name] = {
    p50: Math.round(percentile(times, 50)),
    p95: Math.round(percentile(times, 95)),
    n: times.length,
  };
}

console.log(JSON.stringify({ difficulty: "medium", opts, results }, null, 2));

if (smoke && (results.opening?.p95 ?? 9999) > 450) {
  process.exitCode = 1;
}
