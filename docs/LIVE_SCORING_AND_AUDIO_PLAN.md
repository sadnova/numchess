# Live scoring & game audio — Implementation plan

**Status:** Draft v2.1 — ready to execute  
**Scope:** `@numchess/engine` (live totals API) + `apps/web` (HUD, events, Howler SFX)  
**Parent:** [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) §10–§11, §17; [docs/RULES.md](./RULES.md)  
**Out of scope:** Rule changes, ranked backend, new `rulesVersion`

### Revision history

| Version | Changes |
|---------|---------|
| **v1** | Engine API, live HUD, Kenney UI/Casino baseline, Howler |
| **v2** | Expanded **audio catalog** (Kenney full family, OGA win/jingle packs, board placement CC0), curation workflow, license policy, manifest schema, aesthetic direction |
| **v2.1** | More OGA/UI packs (Chimey, qubodup, Chiptune 2025), Freesound chess/puzzle foley, Kenney Sci‑Fi, optional **UI SFX** (CC0 web library), boardgame-pack zip note |

---

## 1. Goals

### 1.1 Live scoring

Show **official level buckets (L5→L2)** for Rows (P1) and Columns (P2) **as the board fills**, without waiting for the end screen.

**Principle:** A scoring line contributes only when **all six cells on that line are filled**. Those contributions are **final for that line** (same R/D rules as endgame). Incomplete lines stay out of the live totals; partial R/D remains in **Line insights** (heuristic).

> **Superseded for live HUD policy:** See [SPLIT_DIAGONALS_AND_LIVE_SCORING_V2_PLAN.md](./SPLIT_DIAGONALS_AND_LIVE_SCORING_V2_PLAN.md) — dynamic live totals (partial lines) + split diagonals (`rulesVersion` **1.1.0**).

When `ply === 36`, live totals **must equal** `evaluateGame(state).levels` (regression test).

### 1.2 Game audio

Replace barely-audible Web Audio beeps with **real UI SFX**, fix **autoplay / AudioContext resume**, and add cues for **line lock**, **lead change**, and **game end**. Tiered stings when a locked line contributes **L4** or **L5** (user-facing delight; paired with live score feed).

### 1.3 Aesthetic direction (audio)

Numchess is a **calm abstract strategy** game (light UI, paper/felt board). Prefer:

- **Short** clips (&lt; 400 ms for UI; &lt; 1.5 s for win jingle)
- **Warm** placement (wood/chip snap) over harsh digital beeps
- **Distinct but not casino-loud** — Casino Audio for *place* only; avoid slot-machine loops
- **Layered fanfare:** L5 = success jingle; L4 = softer “correct bell”; line lock = subtle confirm

Audition 3–5 candidates per slot before locking `manifest.json` (see §5.4).

---

## 2. Product UX (summary)

| Surface | Behavior |
|---------|----------|
| **Live score HUD** | Compact table: Rows vs Cols × L5–L2; subtitle “Completed lines only” |
| **Score feed** | Last 3–5 **entries**: `Row 3 · +1 L5 (diversity), +1 L2 (repetition)` when a line newly completes |
| **Lead hint** | “Rows lead at L5” when lex order differs (informational until board full) |
| **End screen** | Reuse same numbers; no surprise jump |
| **Settings** | Mute (existing), **volume** slider, toggles: line lock SFX, level fanfare |

Do **not** merge threat bands or partial R/D into live totals.

---

## 3. Engine design

### 3.1 New API (proposed)

Add to `packages/engine/src/scoring.ts`:

```typescript
export function isLineComplete(board: CellValue[], indices: number[]): boolean;

export function scoreCompletedLines(state: GameState): {
  levels: LevelCountsPair;
  ledger: { player1: LineLedgerEntry[]; player2: LineLedgerEntry[] };
  completeLineIds: { rows: string[]; columns: string[] };
};

export function linesNewlyCompleted(
  prevBoard: CellValue[],
  nextBoard: CellValue[],
): { player1: LineLedgerEntry[]; player2: LineLedgerEntry[] };

/** Lex leader from completed-line totals only (null = tie at all compared levels). */
export function liveScoreLeader(levels: LevelCountsPair): {
  leader: 1 | 2 | null;
  decisiveLevel: 2 | 3 | 4 | 5 | null;
};
```

**Implementation:** Reuse `getScoringLines`, `getLineCells`, `analyzeLine`, `addContributions`. For each line, score only if all six indices are non-null. `linesNewlyCompleted` diffs complete line sets before/after last placement (both perspectives for shared diagonals).

### 3.2 Invariants (tests)

| Test | Expectation |
|------|-------------|
| Empty board | All level counts 0 |
| Full board | `scoreCompletedLines` levels === `evaluateGame().levels` |
| Golden mid-game fixture | Hand-count vs complete lines only |
| Single ply | `linesNewlyCompleted` matches manual expectation |
| Diagonal completes once | Both P1 and P2 ledgers get diagonal entry when diag fills |

Add `packages/engine/__tests__/live-scoring.test.ts` (8–12 cases).

### 3.3 No `rulesVersion` bump

Additive API only; note in `packages/engine/CHANGELOG.md`.

---

## 4. Web integration

### 4.1 State & hooks

- **`useLiveScore(state)`** — memo `scoreCompletedLines(state)`.
- **`useScoreFeed`** — ring buffer (max 5); push on `linesNewlyCompleted` after each placement (human + bot).
- **`LiveScorePanel`** — under turn banner or right rail on desktop.

### 4.2 Components

| Component | Responsibility |
|-----------|----------------|
| `LiveScorePanel.tsx` | L5–L2 table, lead hint, pulse on increment |
| `ScoreFeed.tsx` | Recent line-lock entries; `aria-live="polite"` on newest |
| `useGameAudio.ts` | Howler + manifest; replaces `useGameSounds` |

### 4.3 Endgame, undo, replay

- End: `evaluateGame` levels === last live snapshot.
- Undo v1: **clear feed** + recompute HUD (simple).
- Replay scrubber: `scoreCompletedLines` at scrub step.

---

## 5. Audio design

### 5.1 Why change

[`useGameSounds.ts`](../apps/web/src/hooks/useGameSounds.ts): Web Audio sine waves, gain `0.04`, no `AudioContext.resume()`, `playEnd` unused → users often hear nothing.

**Stack:** [Howler.js](https://howlerjs.com/) ([GitHub](https://github.com/goldfire/howler.js/)). Ship **OGG/WebM** + **MP3** fallback per Howler docs.

**React / Vite:**

- Singleton `Howl` per manifest id; load in `useGameAudio` init.
- **`unlockAudio()`** on first user gesture (select, place, Play Classic).
- `interrupt: true` on one-shots (StrictMode-safe).
- PWA: extend `workbox.globPatterns` for `**/*.{ogg,mp3,wav,webm}` (subset only).

### 5.2 License policy (repo)

| Tier | Use in Numchess repo |
|------|----------------------|
| **CC0 / public domain** | ✅ Commit processed files in `public/audio/` |
| **CC-BY / CC-BY-NC** | ❌ Do not ship by default (legal review if needed) |
| **Kenney packs** | ✅ CC0 — optional credit in `ATTRIBUTION.md` |
| **Freesound** | ✅ Only if license is **CC0** on the sound page (verify per file) |

`public/audio/ATTRIBUTION.md`: list sources + URLs even when credit is optional.

### 5.3 Sound library catalog

#### A. Kenney (primary — all CC0)

Download from [kenney.nl/assets](https://kenney.nl/assets) or browse [gamesounds.xyz Kenney directory](https://gamesounds.xyz/?dir=Kenney%27s+Sound+Pack) (mirror listing).

| Pack | URL | Count (approx) | Numchess use |
|------|-----|----------------|--------------|
| **UI Audio** | [kenney.nl/assets/ui-audio](https://kenney.nl/assets/ui-audio) | 50 | Clicks, switches, back, error |
| **Interface Sounds** | [kenney.nl/assets/interface-sounds](https://kenney.nl/assets/interface-sounds) | 100 OGG | Confirm, open/close, notifications |
| **Casino Audio** | [opengameart.org/content/54-casino-sound-effects](https://opengameart.org/content/54-casino-sound-effects) | 54 | Chip/card **place**, soft slide |
| **Digital Audio** | [kenney.nl/assets/digital-audio](https://kenney.nl/assets/digital-audio) | ~50 | Crisp select if UI Audio too dull |
| **Impact Sounds** | [kenney.nl/assets/impact-sounds](https://kenney.nl/assets/impact-sounds) | ~130 | Light tap (use sparingly) |
| **Foley Sounds** | [kenney.nl/assets/foley-sounds](https://kenney.nl/assets/foley-sounds) | varied | Paper/tap alternatives |
| **RPG Audio** | [kenney.nl/assets/rpg-audio](https://kenney.nl/assets/rpg-audio) / [OGA zip](https://opengameart.org/content/50-rpg-sound-effects) | 50 | Soft “inventory” rustle (select alt) |
| **Music Jingles** | [kenney.nl/assets/music-jingles](https://kenney.nl/assets/music-jingles) | short stings | End win / draw variants |
| **Retro Sounds 1/2** | [gamesounds.xyz](https://gamesounds.xyz/?dir=Kenney%27s+Sound+Pack/Retro%20Sounds%201) | retro | Optional 16-bit flavor for L5 |
| **Sci-Fi Sounds** | [kenney.nl/assets/sci-fi-sounds](https://kenney.nl/assets/sci-fi-sounds) | ~50 | Soft “scan” for select alt (use lightly) |
| **Boardgame pack (2D)** | [opengameart.org/content/boardgame-pack](https://opengameart.org/content/boardgame-pack) | art + **bonus SFX in zip** | OGA listing mentions boardgame SFX — **open zip locally**; dedicated audio still comes from Casino/UI packs above |

Full Kenney audio index: [kenney.nl/assets/category:Audio](https://kenney.nl/assets/category:Audio).

**Do not** import entire 100+ file packs into git — **curate 12–18 files** after audition.

#### B. OpenGameArt — win / success / puzzle (CC0)

| Asset | Author | URL | Suggested slot |
|-------|--------|-----|----------------|
| **16bit Success sound** | flush | [opengameart.org/content/16bit-success-sound](https://opengameart.org/content/16bit-success-sound) | `level_5` alt (short, clean) |
| **Win Jingle** (+ ZIP variations) | Fupi | [opengameart.org/content/win-jingle](https://opengameart.org/content/win-jingle) | `end_win` (pick one OGG from zip) |
| **Win sound effect** | Listener | [opengameart.org/content/win-sound-effect](https://opengameart.org/content/win-sound-effect) | `end_win` alt |
| **Win Fanfare** | gchoc | [opengameart.org/content/win-fanfare](https://opengameart.org/content/win-fanfare) | `end_win` (longer — use only if user enables “celebration”) |
| **Positive Sound** | EZduzziteh | [opengameart.org/content/positive-sound](https://opengameart.org/content/positive-sound) | `line_lock` / L4 |
| **Correct Bell** | Fupi | [opengameart.org/content/correct-bell](https://opengameart.org/content/correct-bell) | `level_4` |
| **Cozy Puzzle Jingle & Result** | MintoDog | [opengameart.org/content/cozy-puzzle-jingle-result](https://opengameart.org/content/cozy-puzzle-jingle-result) | Puzzle-themed clear/fail jingles (end win/loss) |
| **UI Sound Effects collection** | Robin Lamb | [opengameart.org/content/ui-sound-effects-button-clicks-user-feedback-notifications](https://opengameart.org/content/ui-sound-effects-button-clicks-user-feedback-notifications) | Audition for select/notify (VCSL-derived, CC0) |
| **Chimey UI Sounds** | MouseBYTE | [opengameart.org/content/chimey-ui-sounds](https://opengameart.org/content/chimey-ui-sounds) (2024) | `line_lock` Confirm · `level_5` Level Up · Cancel for `undo` alt |
| **Well Done** | qubodup | [opengameart.org/content/well-done](https://opengameart.org/content/well-done) | CC0 since 2024-10 — short clap success; `end_win` if you want human warmth (optional `sfxCelebration`) |
| **Chiptune SFX Pack** | FrogPog | [opengameart.org/content/chiptune-sfx-pack](https://opengameart.org/content/chiptune-sfx-pack) (2025) | `level_5` level_up.wav · `end_loss` fail.wav · click.wav for retro mode toggle (future) |
| **Click** | qubodup | [opengameart.org/content/click](https://opengameart.org/content/click) | Tiny universal click; OGA comment: good for **puzzle piece connect** |
| **Click UI Menu SFX** | qubodup | [opengameart.org/content/click-ui-menu-sfx-yesnoselect](https://opengameart.org/content/click-ui-menu-sfx-yesnoselect) | yes/no/select variants for inventory |
| **UI Pack (2024)** | (sprites + **6 SFX**) | [opengameart.org/content/ui-pack](https://opengameart.org/content/ui-pack) | Bonus UI sounds in pack — audition alongside Kenney UI |

#### C. Board / tile placement & chess foley (verify license per file)

| Asset | Author | URL | Notes |
|-------|--------|-----|--------|
| **Piece Placement** | el_boss | [freesound.org/people/el_boss/sounds/546119](https://freesound.org/people/el_boss/sounds/546119/) | ~111 ms wood snap; **top pick for `place`** (verify CC0 on Freesound) |
| **Board Game Pieces** | taure | [freesound.org/people/taure/sounds/555190](https://freesound.org/people/taure/sounds/555190/) | Long WAV — **trim** a single “set down” click for `place` alt |
| **Placing chess pieces** | BiancaBothaPure | [freesound.org/people/BiancaBothaPure/sounds/437484](https://freesound.org/people/BiancaBothaPure/sounds/437484/) | Studio chess on wood — **slice one placement**; check license tag before commit |
| **Puzzle foley (click into place)** | cmorris035 | [freesound.org/people/cmorris035/sounds/254343](https://freesound.org/people/cmorris035/sounds/254343/) | Long take — isolate one “click into place” for `place` / `line_lock` |
| ~~Wooden Object Place~~ | Kostas17 | [freesound.org/people/Kostas17/sounds/537709](https://freesound.org/people/Kostas17/sounds/537709/) | **CC-BY** — do not ship in default CC0 bundle |

#### D. Procedural / web-native (CC0 — optional architecture)

| Library | URL | Notes |
|---------|-----|--------|
| **UI SFX** | [github.com/romainsimon/uisfx](https://github.com/romainsimon/uisfx) | CC0 audio + MIT runtime; semantic IDs (`success`, `drop`, `level-up`); ~5 MB full set — cherry-pick exports or mirror IDs in `manifest.json` only |
| **Kenney All-in-1** | [kenney.itch.io/kenney-game-assets](https://kenney.itch.io/kenney-game-assets) | 1200+ SFX for **local audition**; never commit whole bundle |

#### E. Optional browse (not pre-vetted)

- [OpenGameArt CC0 sound effects tag](https://opengameart.org/art-search-advanced?keys=&field_art_type_tid%5B%5D=13&sort_by=count&sort_order=DESC&items_per_page=24&field_art_tags_tid=cc0) — filter Sound Effect + CC0
- [Freesound search: CC0 + board game](https://freesound.org/search/?q=board+game&f=license:%22Creative+Commons+0%22) — re-verify each result page

### 5.4 Curation workflow (before Phase 3 code)

1. Create `docs/audio/AUDITION_LOG.md` (optional) — table: slot | file | pass/fail | notes.
2. Export **one OGG + one MP3** per chosen clip (ffmpeg if needed).
3. Normalize peak (~−1 dBFS) in Audacity/Reaper so clips feel consistent.
4. Fill `public/audio/manifest.json` (§5.6).
5. Total committed size target: **&lt; 500 KB** for all SFX.

### 5.5 Recommended starter mapping (replace after audition)

| Manifest id | Event | Primary source | Alternate |
|-------------|-------|----------------|-----------|
| `unlock` | AudioContext unlock | Kenney UI click | Interface `click` |
| `select` | Inventory pick | Kenney UI `switch` | Digital `highDown` |
| `place` | Tile on board | **Freesound Piece Placement** or Casino chip | qubodup **Click** (OGA) or trimmed chess/puzzle foley |
| `line_lock` | Line newly complete | Kenney Interface confirm | Positive Sound (OGA) |
| `level_4` | New L4 contribution | Correct Bell (OGA) | Interface `select` |
| `level_5` | New L5 contribution | 16bit Success (OGA) or Chimey **Level Up** | Chiptune `level_up.wav` (retro) |
| `lead_change` | Lex leader flips | Kenney UI soft tick | Interface `scroll` |
| `end_win` | Human won | Win Jingle (Fupi OGA) | Music Jingles (Kenney) |
| `end_draw` | Draw | Kenney UI neutral | Cozy Puzzle failure jingle (soft) |
| `end_loss` | Human lost | Lower tone from UI Audio | Cozy Puzzle failure jingle |
| `undo` | Undo | Kenney UI back | Interface `back` |
| `error` | Illegal (future) | Kenney UI `error` | Interface `negative` |

**Playback rules:** See v1 §5.3 — mute, volume, reduceMotion, debounce per line id, no SFX on partial insights.

### 5.6 `manifest.json` schema (example)

```json
{
  "version": 1,
  "sources": {
    "select": {
      "src": ["/audio/ogg/select.ogg", "/audio/mp3/select.mp3"],
      "volume": 0.6,
      "interrupt": true
    },
    "place": { "src": ["/audio/ogg/place.ogg", "/audio/mp3/place.mp3"], "volume": 0.75 },
    "level_5": { "src": ["/audio/ogg/level_5.ogg", "/audio/mp3/level_5.mp3"], "volume": 0.85 }
  }
}
```

Code: `play(id: keyof sources)` in `lib/audio.ts`.

### 5.7 Settings (`AppSettings`)

```typescript
sfxVolume: number;        // 0–1, default 0.7
sfxLineLock: boolean;     // default true
sfxLevelFanfare: boolean; // L4/L5 on line lock, default true
sfxCelebration: boolean;  // longer end_win fanfare, default false
```

---

## 6. Implementation phases

### Phase 0 — Audio curation (0.5–1 day, can parallel design)

- [ ] Download Kenney UI + Interface + Casino + Sci-Fi (+ optional OGA: Chimey, Win Jingle, 16bit Success, Chiptune pack)
- [ ] Audition Freesound `546119` + trimmed alts; reject CC-BY-only (e.g. Kostas17)
- [ ] Audition §5.5 slots; trim/normalize winners
- [ ] Commit `public/audio/{ogg,mp3}/` + `manifest.json` + `ATTRIBUTION.md`
- [ ] Optional `docs/audio/AUDITION_LOG.md`

### Phase 1 — Engine live scoring (1–2 days)

- [ ] §3.1 API + tests + exports
- [ ] `liveScoreLeader` helper

### Phase 2 — Live score UI (1–2 days)

- [ ] `LiveScorePanel` + `ScoreFeed`
- [ ] Wire `PlayPage`; bot moves; undo clears feed
- [ ] E2E or unit: sandbox row completion → non-zero P1 L counts

### Phase 3 — Audio foundation (1–2 days)

- [ ] `howler` dependency
- [ ] `useGameAudio` + unlock + manifest loader
- [ ] Replace select/place/end; remove oscillator hook
- [ ] PWA precache patterns

### Phase 4 — Line-lock & fanfare (1 day)

- [ ] Hook `linesNewlyCompleted` → `line_lock`, `level_4`, `level_5`
- [ ] Optional `lead_change` when `liveScoreLeader` changes
- [ ] Settings toggles + reduceMotion

### Phase 5 — QA & docs (0.5–1 day)

- [ ] [ACCESSIBILITY.md](./ACCESSIBILITY.md) — feed live region; SFX not sole feedback
- [ ] [RULES.md](./RULES.md) — FAQ live scoring
- [ ] Manual pass: Chrome, Safari iOS, Android (gesture unlock)
- [ ] E2E: keep storageState mute or mock Howler

**Total estimate:** ~6–9 days (including curation).

---

## 7. Acceptance checklist

- [ ] Live totals match `evaluateGame` at ply 36
- [ ] Feed + HUD update on line lock; partial lines excluded
- [ ] Select/place/end audible after one tap (unmuted, volume &gt; 0)
- [ ] L5/L4 fanfare only on real new contributions
- [ ] `ATTRIBUTION.md` lists all committed sources
- [ ] Committed audio &lt; ~500 KB; `pnpm test` + `pnpm test:e2e` green

---

## 8. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Autoplay blocked | `unlockAudio()` + optional UI hint |
| Annoying fanfare | Toggles + debounce + default `sfxCelebration: false` |
| Wrong Freesound license | CC0-only policy; link sound ID in ATTRIBUTION |
| Repo bloat | Curate 12–18 files, not full Kenney zip |
| Live vs official confusion | Copy + RULES FAQ |
| iOS silent switch | Howler html5 fallback doc; user education |

---

## 9. References

### Kenney (CC0)

- [Audio category index](https://kenney.nl/assets/category:Audio) · [gamesounds.xyz mirror](https://gamesounds.xyz/?dir=Kenney%27s+Sound+Pack)
- [UI Audio](https://kenney.nl/assets/ui-audio) · [Interface Sounds](https://kenney.nl/assets/interface-sounds) · [Casino](https://kenney.nl/assets/casino-audio) · [Digital](https://kenney.nl/assets/digital-audio) · [Impact](https://kenney.nl/assets/impact-sounds) · [RPG](https://kenney.nl/assets/rpg-audio) · [Music Jingles](https://kenney.nl/assets/music-jingles) · [Foley](https://kenney.nl/assets/foley-sounds) · [Sci-Fi Sounds](https://kenney.nl/assets/sci-fi-sounds)
- [Boardgame 2D pack](https://opengameart.org/content/boardgame-pack) (check zip for bonus SFX)

### OpenGameArt (CC0 highlights)

- [Interface Sounds (100)](https://opengameart.org/content/interface-sounds) · [50 RPG (Kenney)](https://opengameart.org/content/50-rpg-sound-effects) · [Casino 54](https://opengameart.org/content/54-casino-sound-effects-cards-dice-chips)
- [16bit Success](https://opengameart.org/content/16bit-success-sound) · [Win Jingle](https://opengameart.org/content/win-jingle) · [Win sound](https://opengameart.org/content/win-sound-effect) · [Win Fanfare](https://opengameart.org/content/win-fanfare) · [Well Done](https://opengameart.org/content/well-done)
- [Positive Sound](https://opengameart.org/content/positive-sound) · [Correct Bell](https://opengameart.org/content/correct-bell) · [Cozy Puzzle Jingle](https://opengameart.org/content/cozy-puzzle-jingle-result)
- [Chimey UI Sounds](https://opengameart.org/content/chimey-ui-sounds) · [Chiptune SFX Pack](https://opengameart.org/content/chiptune-sfx-pack) · [Click](https://opengameart.org/content/click) · [Click UI Menu SFX](https://opengameart.org/content/click-ui-menu-sfx-yesnoselect) · [UI Pack 2024](https://opengameart.org/content/ui-pack)
- [UI notifications pack](https://opengameart.org/content/ui-sound-effects-button-clicks-user-feedback-notifications)

### Placement / board (Freesound — verify CC0 on page)

- [Piece Placement (el_boss)](https://freesound.org/people/el_boss/sounds/546119/) · [Board Game Pieces (taure)](https://freesound.org/people/taure/sounds/555190/) · [Chess placement (BiancaBothaPure)](https://freesound.org/people/BiancaBothaPure/sounds/437484/) · [Puzzle foley (cmorris035)](https://freesound.org/people/cmorris035/sounds/254343/)

### Web / procedural

- [UI SFX (romainsimon/uisfx)](https://github.com/romainsimon/uisfx) — CC0 library, semantic cue names

### Tech

- [Howler.js](https://github.com/goldfire/howler.js/) · [use-sound (optional)](https://github.com/joshwcomeau/use-sound)
- Code: [`useGameSounds.ts`](../apps/web/src/hooks/useGameSounds.ts), [`persistence.ts`](../apps/web/src/lib/persistence.ts)

---

## 10. Next step

1. **Phase 0:** Download packs, pick 12–18 clips, write `manifest.json`.  
2. **Phase 1:** Engine live scoring + tests.  
3. **Phase 2–4:** UI + Howler + line-lock audio.

*Last updated: 2026-09-14 (v2.1)*
