/**
 * Build must be run first: pnpm build
 * Starts vite preview, runs Lighthouse accessibility on /play, fails if score < min.
 */
import { spawn } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MIN_SCORE = Number(process.env.LH_A11Y_MIN ?? "0.9");
const HOST = "127.0.0.1";
const PORT = Number(process.env.LH_PREVIEW_PORT ?? "4173");
const BASE = `http://${HOST}:${PORT}`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, ".lighthouse");

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd ?? ROOT,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}

async function waitForHttp(url, ms) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const reportPath = path.join(OUT_DIR, "play-a11y.json");

  const preview = spawn(
    "pnpm",
    [
      "--filter",
      "@numchess/web",
      "exec",
      "vite",
      "preview",
      "--host",
      HOST,
      "--port",
      String(PORT),
    ],
    {
      cwd: ROOT,
      stdio: "ignore",
      shell: process.platform === "win32",
    },
  );

  try {
    await waitForHttp(`${BASE}/play?noTutorial=1`, 90_000);

    const lhCode = await run("npx", [
      "lighthouse",
      `${BASE}/play?noTutorial=1`,
      "--only-categories=accessibility",
      "--output=json",
      `--output-path=${reportPath}`,
      "--quiet",
      "--chrome-flags=--headless=new --no-sandbox",
    ]);
    if (lhCode !== 0) {
      console.error("Lighthouse exited with code", lhCode);
      process.exit(1);
    }

    const raw = await readFile(reportPath, "utf8");
    const lhr = JSON.parse(raw);
    const score = lhr.categories?.accessibility?.score;
    if (score == null) {
      console.error("No accessibility score in Lighthouse report");
      process.exit(1);
    }
    const pct = Math.round(score * 100);
    console.log(
      `Lighthouse accessibility (/play): ${pct} (min ${Math.round(MIN_SCORE * 100)})`,
    );
    if (score < MIN_SCORE) {
      process.exit(1);
    }
  } finally {
    preview.kill("SIGTERM");
    try {
      await rm(OUT_DIR, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
