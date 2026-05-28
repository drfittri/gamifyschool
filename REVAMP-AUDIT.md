# Revamp Audit (2026-05-29)

## Scope
Deep mechanic rewrite of 5 hero games + CC0 sprite assets (Kenney.nl, public domain).

## Games Rewritten

| Game | Old | New |
|---|---|---|
| JetFighter | DOM word clouds | Canvas scroll shooter. Player ship (Kenney spaceShips_001), enemy ships carry letters, laser bullets, parallax starfield, explosion FX. Spell 5 words by shooting letters in order. |
| SpeedTyping | Static lane animation | 4-lane top-down race. Player + 3 AI cars (Kenney racing pack). Type words to boost. Real-time AI speeds. Finish line = 1st/2nd/3rd/4th place result. |
| PhonicsRocket | Word-button select | Canvas vertical scroller. Rocket sprite + animated flame. Letter-fuel capsules (green) and asteroid hazards fall. Drag/arrows to dodge + catch correct letter for current word. |
| GrammarBlast | Tap a/an buttons | Canvas projectile physics cannon. Aim angle/power sliders, gravity arc, two enemy tanks labelled with options. Hit correct tank = correct. Explosion FX. |
| CategorySort | Tap category button | Pointer-based drag-and-drop. Tank sprites dragged into battalion bases. Touch + mouse supported. |

## Assets
- `public/assets/ships/` — player + 3 enemy spaceships (Kenney Space Shooter Extension)
- `public/assets/missiles/` — laser sprite (Kenney)
- `public/assets/meteors/` — 3 asteroid sizes (Kenney)
- `public/assets/rockets/` — rocket sprite (Kenney)
- `public/assets/cars/` — 4 racing cars (Kenney Racing Pack)
- `public/assets/tanks/` — 4 tanks + bullet + explosion (Kenney Tanks)
- `public/assets/LICENSE-ASSETS.md` — CC0 attribution

Total added: ~24 PNGs (~150KB). Bundle impact: 0 (assets served from `/assets/` via Vite public dir, not bundled).

## Playability Checks
- **Instructions screen** — every rewritten game shows a clear instructions panel before play.
- **Controls** — keyboard (arrows, space) + touch (drag, tap) supported on all canvas games.
- **Win condition** — explicit (spell N words, finish race, deploy all recruits, complete questions).
- **TypeScript strict** — `npx tsc -b` clean.
- **Build** — `npm run build` 170ms, 343 kB JS / 102 kB gzip.
- **Game contract** — all rewritten components honour `{words, onCorrect, onWrong, onComplete}` props.

## Not in this pass (polish-only)
WordMatch, SpellingBee, WordScramble, PictureWord, MemoryCard, FillBlank, WordSearch, Hangman, Listening, SentenceBuilder, ComprehensionMap — already themed in commit `8bf7db3`, unchanged.

## Known Limitations
- Canvas games sized to container `aspectRatio`; on very small phones (<360px) text labels may crowd.
- AI race speeds randomised per match — variance can occasionally produce easy wins.
- CategorySort drag relies on Pointer Events (works iOS 13+/Android 6+/all desktop). No fallback for ancient browsers.
