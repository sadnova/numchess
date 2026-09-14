/**
 * Generate short UI WAV clips (local placeholders). Replace with curated Kenney/OGA
 * files via: node scripts/fetch-game-audio.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const sampleRate = 44100;
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "apps", "web", "public", "audio");
const wavDir = join(root, "wav");
mkdirSync(wavDir, { recursive: true });

function writeWav(name, samples) {
  const n = samples.length;
  const data = Buffer.alloc(44 + n * 2);
  data.write("RIFF", 0);
  data.writeUInt32LE(36 + n * 2, 4);
  data.write("WAVE", 8);
  data.write("fmt ", 12);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(sampleRate, 24);
  data.writeUInt32LE(sampleRate * 2, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = samples[i] ?? 0;
    data.writeInt16LE(
      Math.max(-32768, Math.min(32767, Math.floor(s * 32767))),
      44 + i * 2,
    );
  }
  writeFileSync(join(wavDir, `${name}.wav`), data);
}

function writeTone(name, freq, durationSec, gain = 0.25) {
  const n = Math.floor(sampleRate * durationSec);
  const samples = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const env =
      Math.min(1, t * 40) *
      Math.max(0, 1 - (t - durationSec * 0.6) / (durationSec * 0.4));
    samples[i] = Math.sin(2 * Math.PI * freq * t) * gain * env;
  }
  writeWav(name, samples);
}

/** Rising arpeggio for L5 board celebration */
function writeArpeggio(name, freqs, noteSec, gain = 0.2) {
  const gap = noteSec * 0.15;
  const totalSec = freqs.length * noteSec + gap * (freqs.length - 1);
  const n = Math.floor(sampleRate * totalSec);
  const samples = new Float64Array(n);
  let offset = 0;
  for (const freq of freqs) {
    const noteSamples = Math.floor(sampleRate * noteSec);
    for (let i = 0; i < noteSamples && offset + i < n; i++) {
      const t = i / sampleRate;
      const env =
        Math.min(1, t * 60) * Math.max(0, 1 - (t - noteSec * 0.55) / (noteSec * 0.45));
      samples[offset + i] = (samples[offset + i] ?? 0) + Math.sin(2 * Math.PI * freq * t) * gain * env;
    }
    offset += noteSamples + Math.floor(sampleRate * gap);
  }
  writeWav(name, samples);
}

const tones = [
  ["select", 520, 0.05],
  ["place", 280, 0.08],
  ["line_lock", 660, 0.1],
  ["level_4", 784, 0.12],
  ["level_5", 988, 0.18],
  ["lead_change", 440, 0.06],
  ["end_win", 523, 0.35],
  ["end_draw", 392, 0.2],
  ["end_loss", 220, 0.25],
  ["undo", 350, 0.07],
  ["error", 180, 0.12],
];

for (const [name, freq, dur] of tones) {
  writeTone(name, freq, dur);
}

writeArpeggio("level_5_celebrate", [523.25, 659.25, 783.99, 987.77, 1174.66], 0.09, 0.22);

const manifestEntries = [
  ...tones.map(([name]) => [
    name,
    {
      src: [`/audio/wav/${name}.wav`],
      volume: name.startsWith("end_") ? 0.85 : 0.7,
      interrupt: true,
    },
  ]),
  [
    "level_5_celebrate",
    {
      src: ["/audio/wav/level_5_celebrate.wav"],
      volume: 0.82,
      interrupt: true,
    },
  ],
];

const manifest = {
  version: 1,
  sources: Object.fromEntries(manifestEntries),
};

writeFileSync(join(root, "manifest.json"), JSON.stringify(manifest, null, 2));

writeFileSync(
  join(root, "ATTRIBUTION.md"),
  `# Game audio attribution

Placeholder tones in \`wav/\` were generated locally by \`scripts/generate-placeholder-audio.mjs\` for Howler wiring.

Replace with CC0 assets (Kenney UI Audio, Interface Sounds, OGA win jingles, Freesound piece placement) per \`docs/LIVE_SCORING_AND_AUDIO_PLAN.md\`.

Run \`node scripts/fetch-game-audio.mjs\` when network access is available to pull Kenney packs and rebuild \`manifest.json\`.
`,
);

console.log("Wrote placeholder audio to", root);
