/**
 * Optional: download Kenney UI + Interface packs and copy curated OGG files into apps/web/public/audio.
 * Requires network. Run: node scripts/fetch-game-audio.mjs
 */
import { mkdirSync, createWriteStream, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "apps", "web", "public", "audio");
const oggDir = join(root, "ogg");
mkdirSync(oggDir, { recursive: true });

const packs = [
  {
    url: "https://kenney.nl/media/pages/assets/ui-audio/uiAudio.zip",
    map: { select: "switch1.ogg", place: "click1.ogg", undo: "back1.ogg", error: "error1.ogg" },
  },
  {
    url: "https://opengameart.org/sites/default/files/kenney_interfaceSounds.zip",
    map: { line_lock: "confirmation_001.ogg", level_4: "select_001.ogg" },
  },
];

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.status}`);
  await pipeline(res.body, createWriteStream(dest));
}

for (const pack of packs) {
  const zipPath = join(root, "_tmp.zip");
  console.log("Downloading", pack.url);
  await download(pack.url, zipPath);
  const extractDir = join(root, "_tmp_extract");
  mkdirSync(extractDir, { recursive: true });
  if (process.platform === "win32") {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force"`,
    );
  } else {
    execSync(`unzip -o "${zipPath}" -d "${extractDir}"`);
  }
  for (const [id, fileName] of Object.entries(pack.map)) {
    const found = execSync(
      process.platform === "win32"
        ? `powershell -NoProfile -Command "Get-ChildItem -Recurse '${extractDir.replace(/'/g, "''")}' -Filter '${fileName}' | Select-Object -First 1 -ExpandProperty FullName"`
        : `find "${extractDir}" -name "${fileName}" | head -1`,
      { encoding: "utf8" },
    ).trim();
    if (!found || !existsSync(found)) {
      console.warn("Missing", fileName, "for", id);
      continue;
    }
    execSync(
      process.platform === "win32"
        ? `copy /Y "${found}" "${join(oggDir, `${id}.ogg`).replace(/\//g, "\\")}"`
        : `cp "${found}" "${join(oggDir, `${id}.ogg`)}"`,
    );
    console.log("Copied", id, "<-", fileName);
  }
}

console.log("Done. Update manifest.json to point at /audio/ogg/*.ogg and add ATTRIBUTION for Kenney CC0.");
