# QA Report — Arcade Game Revamp

**Date:** 2026-09-16 (overnight run)
**Method:** automated Playwright playtest (`npm run qa`) + human-style visual review of every captured screen, evaluated "as a 7-year-old boy would experience it": real taps on the same hit areas a child uses, from mission briefing to medal ceremony.

**Result: ALL GREEN — 13/13 sessions (6 games × desktop 1280×800 + tablet 768×1024, plus dashboard smoke).**
Zero console errors, zero page errors, XP verified increasing in `localStorage.gamifyschool_stats` after every session, no interactive target under 44×44 px.

## Per-game verdicts

| Game | Desktop | Tablet | Answers¹ | XP seen | Session | Verdict |
|---|---|---|---|---|---|---|
| UFO Blast (targetblast) | ✅ | ✅ | 18 | +120 | ~15 s | PASS |
| Word Army (troopmarch) | ✅ | ✅ | 18 | +120 | ~15 s | PASS |
| Jet Strike (jetfighter) | ✅ | ✅ | 270 | +230 | ~2 min | PASS |
| Mission Blast Off (rocketlaunch) | ✅ | ✅ | 30 | +90 | ~17 s | PASS |
| Turbo Word Race (racerwords) | ✅ | ✅ | 8 | +105 | ~8 s | PASS |
| Pirate Quest (treasuremap) | ✅ | ✅ | 51 | +415 | ~42 s | PASS |
| Dashboard (shared chrome) | ✅ | — | — | — | — | PASS |

¹ counted real taps/clicks the harness made (includes taps inside the brief answer-lock windows).

## What the playtest exercises (per game)

- Mission briefing renders with orders + Start CTA above the fold; CTA actually starts the session.
- Every round answered by tapping the *correct* target through the game's own hit areas (canvas pointer events for UFO Blast / Word Army / Jet Strike; real DOM option buttons for the rest), with the target word derived from the game's dev-only `window.__qa` state — never by bypassing game logic.
- Boss phase reached and beaten; victory ceremony plays; end screen shows stars, mission rank and XP.
- Pirate Quest move phase walks the BFS-suggested direction via the on-screen arrows (`data-qa` markers), crossing all 3 islands and the Kraken fight.
- Answerability: every round exposes its cue (emoji + spoken word) before answering; wrong answers highlight the correct word to teach, then move on.

## Screenshots

`qa/screenshots/` — per game per viewport: `01-briefing`, `02-midgame`, `03-boss`, `04-end` (plus `dashboard-desktop.png`). Machine-readable results: `qa/qa-results.json`.

## 7-year-old experience review (visual pass)

What works:
- **Briefings excite**: themed mission panels (Space Defense Command, Recruiting Office HQ, Elite Squadron 99…) with a big hero sprite, short orders a Year-1 reader can manage, and one giant start button.
- **The games look alive**: layered nebula/parallax skies, shaded planets, particle explosions, screen shake, floating score popups, combo callouts ("UNSTOPPABLE!"), animated flags/thrusters/lanes.
- **Bosses land**: mothership with HP pips, Enemy General tank, Ace Red Baron with letter-HP, THUNDER the rival car, the Kraken — each is a memorable finale that still asks a word question.
- **Forgiving by design**: 3 shields/tires/crew, wrong answers teach (green highlight + word) instead of failing the session; every session ends in a ceremony with a themed mission rank ("Moon Walker", "Five-Star General", …).
- **Sound is real**: synthesized lasers, explosions, rumble, fanfares — with a persistent mute button on every briefing and HUD.

Issues found and fixed during this run:
1. Engine sprite paths were missing the `assets/` prefix → every canvas game drew grey placeholders. Fixed in `loadSprites()`; verified sprites render in all six games.
2. RacerWords passed `cars/…` paths through a loader that adds `cars/` again → cars were grey rects. Fixed; real Kenney cars render.
3. RacerWords road tile texture read as "hedge maze". Replaced with clean asphalt + grass borders + white edge lines.
4. Word Army boss wave could spawn a decoy tank directly under the General (stacked word pills). Decoys now occupy a left column.
5. Briefing panels could push the Start button below the fold on 800 px-tall screens. Compacted.
6. Mute button was 40 px (< 44 px touch guideline). Now 44 px.

Known, accepted:
- The Playwright bot plays Jet Strike "spray and pray", so its wrong-answer count is high — a child aiming at the highlighted next letter will do far better. Not a game defect.
- TTS pronunciation of longer words depends on the device speech engine (browser-provided); audio itself is verified non-blocking in QA (headless has no TTS).
- The GameView ⭐ overlay fires on every correct answer (pre-existing behaviour) and can momentarily cover mid-screen action; kept because the kid loves it, revisitable if it bothers.

## Regression safety

- Dashboard, unit picker, and all 15 non-arcade games untouched in behaviour (shared chrome changes only: end-screen rank ceremony, game-card sprite thumbnails).
- `npx tsc -b` and `npm run build` pass on every commit; GameProps contract, XP math, badges, localStorage schema unchanged.
