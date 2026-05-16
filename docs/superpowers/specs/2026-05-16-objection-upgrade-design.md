# Objection! Power Suit — Phase 1 Upgrade Design
**Date:** 2026-05-16  
**Scope:** Visual, Gameplay, Content & Audio Upgrade (Phase 1)  
**Phase 2 preview:** Online Duel Redesign (architecture included, not implemented here)

---

## Overview

A major upgrade to the existing vanilla HTML/CSS/JS courtroom mystery game "Objection! Power Suit." The game already has campaign, court gameplay, evidence, investigation, negotiation, suits, witnesses, achievements, rankings, shop/wardrobe, Arabic toggle, local duel, and Firebase online duel.

Phase 1 improves: visuals, UI, court drama, game mechanics, content, and audio.  
Phase 2 (separate): redesigns online duel into a real two-sided competitive case mode.

---

## Visual Direction

**Enhanced Noir** — evolutionary polish on the existing deep purple/gold identity. Same palette, premium feel. No visual overhaul for its own sake — every visual improvement serves drama and readability.

- Color palette unchanged: `#07040f`/`#2a1f45` backgrounds, `#c9981e`/`#f0c040` gold, `#c0392b` red
- Typography unchanged: Courier New monospace + Georgia serif for dramatic moments
- New: CSS layered character art with glow states
- New: 6 CSS scene themes anchored in Rich Wood & Amber (classic courtroom)

---

## Architecture

### Files Changed (Phase 1)

| File | Change type |
|---|---|
| `index.html` | Moderate — new HTML panels for character stage, scene backdrop, closing arg UI, toast container |
| `style.css` | Major — CSS character system, 6 scene themes, enhanced noir UI throughout |
| `improvements.js` | Major — trial director, 12 new cases, dramatic court events, better mechanics, expanded audio. If file exceeds ~12,000 lines, split new content into `improvements2.js` loaded after it in HTML. |
| `firebase-online.js` | **Untouched** in Phase 1 |

### Constraints
- Vanilla HTML/CSS/JS only. No frameworks.
- No external assets (audio files, images). Everything synthesized or CSS-drawn.
- Game playable offline except online duel.
- Firebase duel must keep working unchanged.
- Existing features must not break: campaign, investigation, negotiation, court, evidence, suits, witnesses, achievements, rankings, shop, wardrobe, perks, Arabic toggle, local duel, save/load, daily/random cases.

---

## Section 1 — CSS Character System

### Character Stage
A new `#character-stage` div sits inside the courtroom panel, above the canvas (or replacing the canvas for characters). Characters are pure CSS layered divs — no image files required.

### Lawyer Character Structure
Each lawyer character is a stack of absolutely-positioned `<div>` layers:
- Hair layer (gradient, rounded top)
- Head layer (skin tone CSS variable)
- Face details: eyes (shape varies by state), brows, mouth
- Neck/collar
- Shoulders (wider than body, gradient for depth)
- Suit body (lapels clipped with `clip-path`, tie, pocket square)
- Arms (positioned, rotated for pose)
- Hands
- Pants
- Shoes (gloss highlight via `box-shadow`)
- Glow ring behind head (radial-gradient, color varies by player/opponent)

CSS variables control per-character customization:
```css
--char-suit-color: #1a2a5e;
--char-skin-tone: #e8b87a;
--char-hair-color: #1a0800;
--char-glow-color: rgba(201,152,30,0.2);
--char-tie-color: #c9391e;
```

### Player Lawyer States (class swaps)
| Class | Visual change |
|---|---|
| `.state-calm` | Neutral pose, soft gold glow, straight mouth |
| `.state-focused` | Slight forward lean, brows angled down, gold glow brightens |
| `.state-objecting` | Arm raised (transforms arm div), brighter glow, forward lean, open mouth |
| `.state-shocked` | Backward lean, eyes wide (taller eye divs), red flicker on glow |
| `.state-pressured` | Slumped shoulders, sweat pixel visible, glow dims |
| `.state-triumphant` | Arms spread, gold pulse animation on glow, big smile |

### Opponent States
| Class | Visual change |
|---|---|
| `.state-smug` | Arms crossed (arm transform), half-lidded eyes, smirk, red glow |
| `.state-confident` | Upright, arms at sides, red glow steady |
| `.state-annoyed` | Brow furrow, one hand raised, glow flickers |
| `.state-rattled` | Loose stance, sweat pixel, glow dims to orange |
| `.state-angry` | Forward lean, open mouth (yelling), red glow pulses fast |
| `.state-defeated` | Slumped, desaturated (CSS `filter: saturate(0.3)`), glow off |

### Witness States
Simpler set (witnesses appear at the witness stand, smaller):
| Class | Visual |
|---|---|
| `.state-composed` | Neutral, calm expression |
| `.state-nervous` | Brows raised, slight backward lean |
| `.state-defensive` | Arms crossed, frown |
| `.state-sweating` | Sweat pixel, loose collar detail |
| `.state-panicking` | Eyes wide, open mouth, backward lean |
| `.state-broken` | Slumped, desaturated, head down |

### Judge States
Minimal (judge stays at bench):
| Class | Visual |
|---|---|
| `.state-neutral` | Neutral, gavel on desk |
| `.state-annoyed` | Brow furrow, finger raised |
| `.state-impressed` | Slight forward lean, nod indicator |
| `.state-angry` | Both hands on desk, gavel raised, red tint on bench |

### State Transitions
State class changes fire via JS: `charEl.className = 'lawyer-char state-objecting'`.  
CSS `transition: all 0.3s ease` on all transform/opacity properties for smooth swaps.  
Major dramatic states (objecting, shocked, triumphant) also trigger a companion screen effect (flash, shake, or spotlight).

---

## Section 2 — 6 Scene Themes

Applied as a class on `#court-wrapper` (or `body`). Each theme overrides CSS variables for backdrop, furniture, and ambient color.

### Theme Definitions

#### `scene-classic` — Rich Wood & Amber *(anchor theme)*
- Background: dark oak gradient (`#1a0e04` → `#3a2010`)
- Props: high arched windows with amber light shafts (CSS gradients), carved judge bench, jury box left side
- Furniture colors: `#3a2010` wood tones, `#c9981e` gold trim on bench
- Lighting: warm amber radial from windows
- Used for: standard trials, corruption cases, inheritance disputes

#### `scene-corporate` — Steel & Neon Blue
- Background: near-black with subtle grid lines (`#04080f`)
- Props: LED accent strip at ceiling and floor (CSS linear-gradient), digital screen on judge bench, logo wall behind judge, glass dividers
- Furniture: `#0a1428` dark steel tones, `#4488ff` blue accents
- Lighting: cold blue-white
- Used for: corporate fraud, hacked footage, AI contract, NDA cases

#### `scene-night` — Midnight Purple + Harsh Light
- Background: `#000005` → `#0a0020`
- Props: single bare-bulb light (CSS radial-gradient spotlight), rain streaks on window (CSS animation), wall clock showing 2:47 AM, stacked papers on table
- Furniture: `#0a0815` dark purple-black
- Lighting: harsh yellow-white spotlight cone, everything else in deep shadow
- Used for: emergency hearings, disappearing witness, midnight merger cases

#### `scene-fashion` — Rose & Ivory
- Background: `#1a0a14` → `#2a1020`
- Props: velvet rope suggestion (CSS border), gallery-style white spotlights, fashion sketch on wall (CSS art), audience murmur indicator
- Furniture: `#2a1020` with ivory/rose accents (`#f0e0e8`)
- Lighting: gallery-style white spots, warm rose ambient
- Used for: stolen collection, fashion design, gala blackmail cases

#### `scene-grand-appeals` — Deep Crimson & Gold
- Background: `#0a0004` → `#1a0808`
- Props: marble column suggestions (CSS vertical gradients), vaulted ceiling arc (CSS border-radius), formal gallery silhouettes, heavy seal on bench
- Furniture: `#1a0808` near-black with crimson `#8b0000` and heavy gold `#c9981e`
- Lighting: deep crimson ambient, gold accent on bench seal
- Used for: appeals court, NDA conspiracy, bribed juror, charity gala cases

#### `scene-corruption` — Sickly Green & Black
- Background: `#000500` → `#010a02`
- Props: flickering light effect (CSS animation with opacity flicker), cracked seal on bench (CSS border with gap), fog layer (CSS gradient overlay at floor), broken venetian blind suggestion
- Furniture: near-black with sickly `#1a4a1a` green tints
- Lighting: harsh flickering green-white, uneven shadows
- Used for: corrupted judge final case, bribery, cover-up cases

### Scene Transition
When a case loads, `body` gets the scene class. CSS `transition: background 1s ease` fades between themes. A brief `scene-intro` text overlay shows the venue name before trial begins.

---

## Section 3 — Homepage & UI Overhaul

### Homepage

**Hero section:**
- Title: `OBJECTION!` in large CSS text — `font-size: clamp(48px, 8vw, 96px)`, `letter-spacing: 6px`, gold gradient text (`background-clip: text`), stacked text-shadow for depth
- Subtitle: `POWER SUIT` tracked caps, smaller, muted gold
- Animated scanline sweep: `::after` pseudo-element with slow diagonal animation
- Faint courthouse silhouette in background: CSS-drawn columns and arch using `border-radius` and `clip-path`, `opacity: 0.04`
- Animated gavel: CSS-only rotation keyframe, subtle

**Mode cards (4):**
Each card has: colored left border, icon (CSS-drawn or unicode symbol), title, 1-line description, `→` CTA.
- Campaign: gold border, `⚖` icon
- Duel: red border, `⚔` icon  
- Shop/Wardrobe: purple border, `✦` icon
- Rankings: blue border, `◈` icon

Daily case card: separate highlight card, pulsing red dot, shows today's case title and difficulty.

**Hover effects:** `transform: translateY(-4px)`, border glow brightens, `transition: 0.2s ease`.

**Mobile:** cards collapse to single column below 720px. Title font scales with `clamp()`. Courthouse silhouette hides below 480px.

### In-Game UI Improvements

**Stat bars:**
- Gradient fill with animated glow on value change (`@keyframes barPulse`)
- Numeric value shown alongside bar (`83 / 100`)
- Danger state: bar pulses red when below 25 (`@keyframes dangerPulse`)
- Labels: uppercase, letter-spaced, small

**Testimony box:**
- Ruled-paper background with subtle horizontal lines
- Speaker name badge: colored by role (red for prosecution witness, blue for defense, gold for judge, grey for neutral)
- Statement text: typewriter reveal animation (`@keyframes typewriter`) — characters appear left to right
- Weakness hint: appears as faint underline when witness confidence is below 30

**Evidence cards:**
- Parchment background with aged texture (CSS `radial-gradient` noise)
- Strength indicator: small colored bar at bottom (green/yellow/red)
- Foundation status icon: `✓` (ready) or `○` (not ready yet) — gold vs grey
- `MATCH!` flash: card scales up 1.15×, gold border pulses, then returns
- `CHALLENGED` flash: card shakes, red border, then dims

**Court log:**
- Right-side scrollable panel (collapsible on mobile)
- Color-coded entries: gold for successful moves, red for penalties, grey for neutral events
- Each entry: short timestamp + icon + text (`⚖ Evidence matched — jury swayed +8`)
- Auto-scrolls to latest entry

**Feedback toasts:**
- Container: `#toast-container`, bottom-center, `position: fixed`
- Toast: slides up from bottom, holds 2s, fades out
- Colors: gold for positive, red for negative, grey for neutral
- Examples: "Great timing!", "Weak foundation — jury skeptical", "Jury liked that", "Witness losing confidence", "Opponent preparing a challenge", "This evidence may be stronger later"

**Phase transition banners:**
- Full-width overlay: large tracked text ("INVESTIGATION PHASE", "COURT IN SESSION", "CLOSING ARGUMENT")
- Holds 1.5s, slides up to reveal game state beneath
- Colors match scene theme

---

## Section 4 — Trial Director System

### Trial Patterns

Declared per case as `trialPattern: "patternName"`. The trial director reads this at court start and configures the trial accordingly.

| Pattern | Judge patience drain | Opponent behavior | Special rule |
|---|---|---|---|
| `standardTrial` | Normal (1/turn) | Reactive | No special rule |
| `hostileWitness` | Normal | Protective (blocks 1 pressure/round) | Witness confidence starts at 90, resets to 60 on any successful cross |
| `contradictionChain` | Normal | Tracks contradictions | Must expose 3 linked contradictions in order to unlock closing |
| `trapCase` | Normal | Has hidden counter-evidence | Playing certain evidence triggers opponent's prepared counter |
| `mediaPressure` | Accelerated (+2/turn) | Attacks jury | Jury trust decays 3/turn passively |
| `surpriseWitness` | Normal | Introduces witness | At round 4, new witness appears with fresh testimony and different weakness |
| `emotionalAppeal` | Fast (+3/turn) | Exploits jury swings | Jury trust swings ±20 on emotional moves instead of ±10 |
| `corporateCoverup` | Normal | Challenges evidence | Every evidence play triggers a foundation challenge — must answer correctly |

### Dramatic Court Events

Probability weighted by pattern. Each event interrupts the normal action flow.

| Event | Trigger | Effect | Player response |
|---|---|---|---|
| `judgeWarning` | 3 wrong moves in a row | Screen flash, gavel SFX, patience −15 | None required — automatic |
| `opponentObjection` | After player presents evidence | Opponent interrupts, challenges evidence | Player must select: Sustain / Overrule / Counter |
| `witnessHesitation` | Witness confidence 40–60 | Pause animation, hint flashes 2s | Window to Press or let pass |
| `witnessChangesStatement` | After successful pressure | Previous statement marked invalid | New statement appears, old evidence links reset |
| `surpriseDocument` | Round 4 in `surpriseWitness` | New card added to hand | Automatic — toast notification |
| `foundationChallenge` | `corporateCoverup` pattern | Opponent demands chain of custody | Player picks correct foundation answer |
| `clientPanic` | Client trust < 25 | Trust drops −10 | Emergency "Reassure Client" action available 1 turn |
| `juryReaction` | Every 3 turns | Jury swings based on last 3 moves | Automatic — displayed in court log |
| `mediaLeak` | `mediaPressure` pattern, round 5+ | Public gallery reacts | Judge threatens contempt — player must "Calm Court" or lose patience |
| `witnessBreakdown` | Witness confidence → 0 | Auto-contradiction exposed | Automatic — leads to `contradictionFound` moment |
| `recessOpportunity` | Judge patience 25–40 | Recess offered | Player chooses: Take recess (patience +20, momentum −10) or Continue |
| `finalContradiction` | All 3 contradictions in chain exposed | All evidence cards shake, spotlight on key card | One correct evidence play ends trial with bonus |

### Wrong-Answer Feedback Chain
1. Red feedback toast fires immediately ("Weak foundation — jury skeptical")
2. Opponent momentum bar shifts right (visible indicator)
3. After 3 consecutive wrong moves: court event fires (`judgeWarning` or `juryReaction`)
4. Closing argument difficulty multiplier increases (tracked as `closingPenalty` counter)

### Multiple Win Paths
Not every path is available in every case — declared in case data as `winPaths: []`.

| Win path | Condition |
|---|---|
| `evidenceWin` | Opponent credibility → 0 |
| `contradictionWin` | All chain contradictions exposed |
| `juryWin` | Jury trust > 80 + closing argument score > 70 |
| `pressureWin` | Witness confidence → 0, confession triggered |
| `trapAvoidWin` | Survive opponent's trap + counter it successfully |
| `closingWin` | Score-based closing argument verdict |

---

## Section 5 — 12 New Campaign Cases

Each case includes: title, category, summary, client name + statement, opponent name, witnesses (1–2), evidence list (6–8 items), testimony lines (5–6), contradiction links, trialPattern, sceneTheme, winPaths, case twist, and case-specific judge/opponent dialogue.

| Case # | Title | Scene | Pattern | Win paths | Twist |
|---|---|---|---|---|---|
| 7 | *The Stolen Collection* | `scene-fashion` | `contradictionChain` | contradiction, jury | Designer staged their own theft for insurance payout |
| 8 | *Forged in Ink* | `scene-classic` | `trapCase` | evidence, trap-avoid | Opponent holds forged counter-document — wrong evidence triggers it |
| 9 | *The Charity Gala Blackmail* | `scene-grand-appeals` | `mediaPressure` | jury, closing | Victim is secretly guilty of tax fraud — revealed mid-trial |
| 10 | *Silent Ledger* | `scene-corporate` | `corporateCoverup` | evidence, pressure | CFO destroyed digital backups — paper trail is only evidence |
| 11 | *The Disappeared Witness* | `scene-night` | `surpriseWitness` | surprise, contradiction | Witness faked disappearance — reappears at round 4 |
| 12 | *Poisoned Contract* | `scene-corporate` | `hostileWitness` | evidence, closing | Contract has hidden termination clause buried in exhibit B |
| 13 | *The Hacked Footage* | `scene-corporate` | `trapCase` | evidence, trap-avoid | Security footage was AI-edited — must prove tampering |
| 14 | *Inheritance of Lies* | `scene-classic` | `contradictionChain` | contradiction, jury | Two conflicting wills — both signed, one is forged |
| 15 | *The NDA Conspiracy* | `scene-grand-appeals` | `corporateCoverup` | evidence, closing | NDA illegally suppresses criminal evidence — foundation challenge on every play |
| 16 | *Midnight Emergency* | `scene-night` | `emotionalAppeal` | jury, closing | Judge has undisclosed personal conflict — must navigate carefully |
| 17 | *The Bribed Juror* | `scene-grand-appeals` | `hostileWitness` | pressure, contradiction | Your key witness was paid off — their testimony must be exposed, not relied on |
| 18 | *The Corrupted Judge* | `scene-corruption` | `contradictionChain` | contradiction | Final boss — judge is in defendant's pocket, patience drains 5/turn, must expose 3 judicial contradictions |

### Case Data Structure (per case)
```js
{
  id: "case07",
  title: "The Stolen Collection",
  category: "Fashion Theft",
  difficulty: 3,
  sceneTheme: "scene-fashion",
  trialPattern: "contradictionChain",
  winPaths: ["contradictionWin", "juryWin"],
  summary: "...",
  client: { name: "...", statement: "..." },
  opponent: { name: "...", style: "shark" },
  witnesses: [
    { name: "...", role: "...", personality: "deceptive", startConfidence: 80 }
  ],
  evidence: [
    { id: "ev01", name: "...", strength: 8, risk: "medium", foundation: "crossExamineFirst",
      bestTiming: "mid", counterType: "hearsay", description: "..." }
  ],
  testimony: [
    { id: "t1", speaker: "witness", text: "...", weaknessEvidence: "ev01",
      weaknessObjection: "hearsay", statementType: "factStatement" }
  ],
  contradictions: [
    { id: "c1", t1: "t1", t2: "t3", resolveWith: "ev02", description: "..." }
  ],
  caseDialogue: { judge: "...", opponent: "...", client: "..." },
  caseTwist: { trigger: "round3", event: "witnessChangesStatement", description: "..." }
}
```

---

## Section 6 — Enhanced Mechanics

### Evidence Foundation System
Each evidence card has a `foundation` field:
- `"free"` — playable any time
- `"crossExamineFirst"` — must cross-examine the current witness at least once before playing
- `"pressFirst"` — must use Pressure action at least once before playing
- `"witnessConfidenceBelow50"` — only playable when witness confidence < 50
- `"contradictionExposed"` — only playable after first contradiction is exposed

Playing evidence before its foundation is met:
- Card is `CHALLENGED` (shake animation, red flash)
- Opponent gains momentum
- Evidence is not consumed but credibility −5

Foundation readiness shown on card: `✓` icon (gold) when ready, `○` (grey) when not.

### Witness Personality System
Each witness has `personality` field affecting behavior:

| Personality | Cross-examine effect | Pressure effect | Best approach |
|---|---|---|---|
| `loyal` | −5 confidence (resists) | −8 confidence | Hard evidence only |
| `nervous` | −15 confidence | −20 confidence | Any approach works fast |
| `deceptive` | −10 confidence, misleading hint | −8 confidence | Must use correct objection type |
| `arrogant` | −5 confidence (immune to emotion) | −12 confidence | Logic/evidence, not charm |
| `fearful` | −20 confidence | −25 confidence (may false-confess) | Gentle pressure, verify confession |

Personality revealed to player via: Strategist suit style (shown at start), or after witness confidence drops below 50 (hint appears in court log).

### Suit / Lawyer Style — Expanded Effects

| Style | Gameplay effect (new) |
|---|---|
| The Charmer | Nervous/fearful witnesses lose 15 extra confidence per cross. Jury trust recovers 5/turn passively. `clientPanic` event never fires. |
| The Shark | Pressure deals double confidence damage. Arrogant witnesses have −20 resistance. Judge patience drains 1 extra/turn (risk). |
| The Strategist | Foundation status shown on all cards (no guessing). Witness personality revealed at trial start. Hints appear 10% more often. |
| The Closer | Closing argument score +25%. Settlement always available regardless of trial state. Recessopportunity fires 1 extra time per trial. |

### Closing Argument Minigame
Replaces single-button close. Available when: trial clock expired, or manually triggered (if closing is unlocked).

**Step 1 — Pick strongest evidence** (from successfully played cards this trial):
- Displayed as selectable cards
- Cards that landed a `MATCH` shown with gold star
- Player picks 1

**Step 2 — Pick key contradiction** (from contradictions exposed this trial):
- If none exposed, this step is skipped (penalty to score)
- Player picks 1

**Step 3 — Pick final tone**:
- `Logical` — boosts score if jury trust is neutral
- `Emotional` — boosts score if jury trust > 50
- `Aggressive` — boosts score if opponent credibility is low, risky if not

**Scoring:**
```
base = 50
+ evidenceStrength × 5          (max +40)
+ contradictionBonus × 10       (max +30 for 3 contradictions)
+ toneMoodMatch × 15            (max +15)
− closingPenalty × 5            (per wrong move earlier — tracked in S.closingPenalty)
− missedFoundation × 8          (per challenged evidence — tracked in S.missedFoundations)
```
Both `closingPenalty` and `missedFoundations` must be added to the game state object `S` and reset at trial start.

Score → verdict:
- 90–100: Perfect verdict, bonus XP, achievement eligible
- 70–89: Guilty verdict, win
- 50–69: Partial verdict — hung jury, narrow win
- Below 50: Not guilty / mistrial, loss

---

## Section 7 — Audio System

Expands the existing Web Audio API system in `improvements.js`.

### New Procedural Sound Effects

| Event | Sound design |
|---|---|
| `OBJECTION!` | Sharp sine-wave brass sting, short reverb tail (0.8s) |
| Evidence slam | Low-frequency thud (80Hz, 0.2s) + paper rustle (white noise burst) |
| Correct evidence | Rising major chord arpeggio (C-E-G, 0.6s) |
| Wrong move | Dissonant descending tritone (0.4s) |
| Judge warning | Two gavel hits (percussive transient, 0.1s gap) + crowd murmur spike |
| Witness breakdown | Glass shimmer (high freq sweep) + crowd gasp (filtered noise) |
| Contradiction found | Deep impact (40Hz sine, 0.5s) + 0.3s silence + resolution chord |
| Final verdict | Four-chord synthesized orchestral sting (2.5s) |
| UI button click | Soft ink-stamp transient (1000Hz, 20ms) |
| Achievement unlock | Gold bell chord (triangle wave, C5-E5-G5, 1.2s) |
| Witness hesitation | Held breath (low filtered noise, 1s) |
| Client panic | Descending minor run (piano-like, 0.5s) |
| Combo streak | Ascending ping per combo count (pitch rises with combo) |

### Ambient Atmosphere Per Scene

Each scene has a layered ambient track built from Web Audio API nodes:

| Scene | Ambience layers |
|---|---|
| `scene-classic` | Low-pass filtered noise (murmur) + slow periodic AC hum + distant traffic (sub-bass sweep) |
| `scene-corporate` | HVAC steady drone (filtered 200Hz) + sparse keyboard clicks (random percussive bursts) |
| `scene-night` | Rain (white noise, filtered) + thunder (rare low rumble) + building creak (low periodic) |
| `scene-fashion` | Crowd whisper (filtered noise, quieter) + camera shutter clicks (sparse transients) |
| `scene-grand-appeals` | Cathedral reverb simulation (long delay chain) + formal low murmur |
| `scene-corruption` | Broken fluorescent buzz (sawtooth, flicker modulated) + deep unease drone (15Hz sub) |

Ambient volume: max 15% of master. Fades in over 3s on scene load. Fades out on phase change.

### Dynamic Tension Layer

| State | Trigger | Music behavior |
|---|---|---|
| `calm` | Menu/investigation/pre-trial | Slow filtered pad, 60 BPM, minimal |
| `building` | Trial rounds 1–3 | Tempo 80 BPM, light string-like oscillators enter |
| `high-pressure` | Judge patience < 30 OR jury < 20 | Tempo 100 BPM, percussion loop (kick + snare pattern) |
| `final-moment` | Final contradiction / closing argument | Full swell, all layers active, tempo 120 BPM |
| `verdict-win` | Win condition met | Major resolution sting |
| `verdict-loss` | Loss condition met | Minor descending sting |

Layers cross-fade using `GainNode` ramps (`linearRampToValueAtTime`) — no audible cuts.

### Audio Settings (saved to `localStorage`)
- `audioMasterVolume` (0–1, default 0.7)
- `audioMusicVolume` (0–1, default 0.4)
- `audioSFXVolume` (0–1, default 0.8)
- `audioMuted` (boolean, default false)

Settings panel: accessible from main menu and pause/recess screen. Sliders + mute toggle button. Changes apply immediately and persist.

Audio initializes on first user interaction (click/keypress) to satisfy browser autoplay policy. Safe fallback: if AudioContext creation fails, all sound calls are no-ops.

---

## Section 8 — Phase 2 Preview: Online Duel Redesign

*Not implemented in Phase 1. Architecture documented here for Phase 2 planning.*

### Core Concept
Both players fight around the same general case but represent opposite clients. Each player has private clues, a different evidence pool, and a different win condition.

### Firebase Data Structure (Phase 2)
```
/rooms/{code}/
  case: { id, title, sceneTheme, trialPattern, description }
  players/
    p1: { name, style, client: {name, statement}, privateClues: [], loadout: [] }
    p2: { name, style, client: {name, statement}, privateClues: [], loadout: [] }
  sharedState/
    juryTrust: { p1: 50, p2: 50 }
    judgePatience: 100
    momentum: { p1: 0, p2: 0 }
    revealedEvidence: []       // only evidence actually played in court
    actionLog: []
    round: 1
  turn: "p1" | "p2"
  phase: "prep" | "investigation" | "loadout" | "court" | "closing" | "verdict"
  winner: null | "p1" | "p2"
```

Private clues stay hidden from opponent until played in court (never written to shared state until revealed).

### Duel Case Structure
Each duel case has two `clientSide` objects:
```js
{
  id: "duel-fashion-01",
  title: "The Stolen Collection (Duel)",
  sceneTheme: "scene-fashion",
  sides: {
    plaintiff: {
      client: { name: "Sofia Renard", statement: "My designs were stolen..." },
      privateClues: [...],        // only visible to p1
      evidencePool: [...],        // p1 picks 5 from these 8
      winCondition: "prove theft"
    },
    defendant: {
      client: { name: "Viktor Hale", statement: "The contract granted us usage..." },
      privateClues: [...],        // only visible to p2
      evidencePool: [...],        // p2 picks 5 from these 8
      winCondition: "prove contract right"
    }
  }
}
```

### Duel Flow Phases
1. **Room** — host creates, guest joins via code
2. **Case selection** — host picks duel case; shared case data loads for both
3. **Client assignment** — host → plaintiff side, guest → defendant side (or random)
4. **Prep** — each player reviews their private client statement and clues
5. **Loadout** — each player picks 5 evidence cards from their pool (8 available)
6. **Court** — turn-based, same action set as campaign
7. **Closing** — both players build closing argument simultaneously, revealed together
8. **Verdict** — winner determined by combined scoring

---

## Testing Plan

### Phase 1 — How to Test

1. **Homepage:** Open `index.html` in browser. Verify: title glow, card hover effects, daily case card, mobile layout (narrow window).
2. **Scene themes:** Start a case and verify the courtroom background matches the case's `sceneTheme`. Check all 6 themes across 6 different cases.
3. **Character states:** Play through a trial. Trigger an objection — verify player char shows `state-objecting`. Wrong move — verify `state-shocked`. Win — verify `state-triumphant`.
4. **Witness states:** Press a witness until confidence drops to 0 — verify `state-broken` pose fires.
5. **Trial director:** Play Case 18 (corrupted judge) — verify patience drains 5/turn, `contradictionChain` pattern active, closing locked until 3 contradictions exposed.
6. **Dramatic events:** Play Case 8 (forged in ink) — trigger wrong evidence early to fire opponent's trap counter.
7. **Closing argument minigame:** Reach closing in any case — verify 3-step pick UI appears, score calculated, verdict matches.
8. **Audio:** Trigger OBJECTION!, witness breakdown, and verdict — verify sounds play. Open audio settings, mute, verify silence. Reload — verify mute persists.
9. **Feedback toasts:** Make a wrong move — verify red toast appears and auto-dismisses. Make a correct match — verify gold toast.
10. **Existing features:** Complete one full campaign case, open shop, check rankings, toggle Arabic — verify nothing broken.
11. **Firebase duel:** Create online room, join from second browser tab, complete a duel — verify turns sync and winner is declared.

---

*Phase 2 spec to be written separately before online duel implementation begins.*
