import { Howl, Howler } from "howler";
import type { AudioManifest, SfxId } from "./audioTypes";

let parsed: AudioManifest | null = null;

const pool = new Map<SfxId, Howl>();
let unlocked = false;

export function initAudioFromManifest(manifest: AudioManifest): void {
  parsed = manifest;
  pool.clear();
}

function getHowl(id: SfxId): Howl {
  if (!parsed) throw new Error("Audio manifest not loaded");
  let h = pool.get(id);
  if (h) return h;
  const def = parsed.sources[id];
  if (!def) throw new Error(`Missing sfx ${id}`);
  h = new Howl({
    src: def.src,
    volume: def.volume ?? 1,
    preload: true,
  });
  pool.set(id, h);
  return h;
}

export function unlockAudio(): void {
  if (unlocked) return;
  unlocked = true;
  if (Howler.ctx?.state === "suspended") {
    void Howler.ctx.resume();
  }
}

export function playSfx(id: SfxId, volumeScale = 1): void {
  if (!unlocked || !parsed) return;
  const def = parsed.sources[id];
  const howl = getHowl(id);
  const base = def.volume ?? 1;
  howl.volume(Math.min(1, base * volumeScale));
  howl.play();
}

export function setMasterVolume(scale: number): void {
  Howler.volume(Math.max(0, Math.min(1, scale)));
}

export function preloadAllSfx(): void {
  if (!parsed) return;
  for (const id of Object.keys(parsed.sources) as SfxId[]) {
    getHowl(id);
  }
}
