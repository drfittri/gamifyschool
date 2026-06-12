# GamifySchool — Agent Guide

A gamified English learning web app for a 7-year-old Year 1 student in Malaysia. Hosted on GitHub Pages.

## Live Site
`https://drfittri.github.io/gamifyschool/`

## Tech Stack
| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 + custom claymorphism design system |
| Icons | Lucide React (SVG, no emoji as UI icons) |
| Routing | React Router 7 (HashRouter — required for GitHub Pages) |
| State | React useState + localStorage (no backend) |
| Persistence | `localStorage` key: `gamifyschool_stats` |
| Sound | Web Audio API oscillators (no audio files) |
| Hosting | GitHub Pages (`gh-pages` branch) |

## Project Structure

```
src/
├── App.tsx                  # Root: HashRouter, route config, Dashboard, LessonView, GameView
├── main.tsx                 # Entry point
├── index.css                # Tailwind imports, claymorphism tokens, animations, font imports
├── utils/
│   └── types.ts             # All types, game definitions, XP math, GAME_DEFINITIONS array
├── data/
│   ├── lessons.ts           # 15 curriculum units (words, phrases, sentences, phonics)
│   └── badges.ts            # 15 badge definitions with conditionMet callbacks
├── hooks/
│   ├── useProgress.ts       # localStorage-backed XP/level/badge state
│   └── useSound.ts          # Web Audio API: speak(), playCorrect(), playWrong(), etc.
├── components/
│   ├── LevelBar.tsx         # XP bar with level indicator
│   ├── BadgeGrid.tsx        # Grid of earned/locked badges
│   ├── Confetti.tsx         # Celebration particle overlay (60 colored shapes)
│   ├── GamePicker.tsx       # Unit selector → game selector (two-step)
│   └── GameWrapper.tsx      # (unused legacy wrapper — kept for reference)
└── games/
    ├── WordMatch.tsx        # Match word↔emoji pairs (click both columns)
    ├── SpellingBee.tsx      # Click shuffled letters to spell a word
    ├── WordScramble.tsx     # Unscramble jumbled letters with on-screen keyboard
    ├── PictureWord.tsx      # See emoji, pick matching word from 4 options
    ├── MemoryCard.tsx       # Flip cards to find word↔emoji pairs (4×N grid)
    ├── FillBlank.tsx        # Complete sentence blanks with word options
    ├── WordSearch.tsx       # Find words in random-filled letter grid
    ├── Hangman.tsx          # Classic hangman with emoji clues
    ├── SpeedTyping.tsx      # 4-lane top-down typing race (canvas)
    ├── Listening.tsx        # Browser TTS reads a word, pick from options
    ├── RacerWords.tsx       # Real-time 4-car canvas race; hear word, tap to boost
    ├── TargetBlast.tsx      # Canvas UFO shooter; hear/see word, blast the right UFO
    ├── TroopMarch.tsx       # Canvas battlefield; recruit labeled tanks to your base
    ├── RocketLaunch.tsx     # Canvas launchpad; fuel rocket, cinematic moon launch
    ├── TreasureMap.tsx      # 5×5 pirate map; answer then choose your move (BFS-solvable)
    ├── JetFighter.tsx       # Canvas scroll shooter; spell words by shooting letters
    └── shared/wordBank.ts   # Shared WORD_EMOJI map + makeRounds() question builder
```

## Architecture

### Routing (HashRouter)
```
/#/                              → Dashboard (lesson picker + badge tab)
/#/play/:unitIndex               → LessonView (unit detail + 16 game buttons)
/#/play/:unitIndex/:gameId       → GameView (game component + end screen)
```

### Data Flow
1. `data/lessons.ts` exports `LessonTopic[]` — 15 units each with `words`, `phrases`, `sentences`, `phonics`
2. Games receive `words[]` and callbacks (`onCorrect`, `onWrong`, `onComplete`)
3. `App.tsx > GameView` wires callbacks to `useProgress()` actions
4. `useProgress()` reads/writes `localStorage` via `gamifyschool_stats` key
5. Badges auto-checked in `App.useEffect` → `awardBadge()` on condition match
6. XP math: `xpForLevel(n) = floor(100 * n^1.5)`, XP_PER_ANSWER=10, STREAK_BONUS=5 (streak≥3), PERFECT_BONUS=25

### Game Component Contract
Every game must accept this interface:
```typescript
interface GameProps {
  words: string[]          // Available vocabulary from the selected unit (or all if cross-unit)
  onCorrect: () => void    // Call on each correct answer
  onWrong: () => void      // Call on each wrong answer
  onComplete: () => void   // Call when the game session ends (all rounds done / game over)
}
```

### Game Registration
To add a game, you must register it in **3 places**:
1. **`src/utils/types.ts`** — add entry to `GAME_DEFINITIONS[]` with id, title, emoji, description, color, bgColor
2. **`src/games/NewGame.tsx`** — create the component implementing `GameProps`
3. **`src/App.tsx`** — add import, add to `gameComponents` map, add to `GAME_ICONS` map

## Design System

### Theme: Claymorphism
- Soft 3D, bubbly, toy-like aesthetic designed for young children
- CSS custom properties in `index.css`:
  - `--color-clay-bg: #EEF2FF` (light indigo background)
  - `--color-clay-primary: #4F46E5` (indigo)
  - `--color-clay-cta: #F97316` (orange accent)
  - `--color-clay-text: #1E1B4B` (deep indigo text)
  - `--shadow-clay-outer`, `--shadow-clay-inner`, `--shadow-clay-card`, `--shadow-clay-button`
- CSS utility classes: `.clay-card`, `.clay-card-interactive`, `.clay-button`, `.clay-surface`
- Border: `3px solid white/80` on cards, 2-3px on buttons
- Border radius: 16-24px everywhere
- Fonts: Fredoka (headings), Nunito (body) — loaded from Google Fonts
- Base font size: 18px (larger for children)
- Minimum touch targets: 44×44px

### Icon Policy
- **UI elements** (buttons, nav, badges): use Lucide SVG icons only — no emoji
- **Game content** (word illustrations): emoji are acceptable as visual learning aids for a 7-year-old
- Lucide icon naming: `Puzzle`, `Type`, `LayoutGrid`, `Image`, `PenLine`, `Search`, `HelpCircle`, `Zap`, `Ear`, `Car`, `Crosshair`, `Sword`, `Rocket`, `Compass`

### Animations
- `animate-float` — gentle 3s float (used on game icons)
- `animate-pop-in` — scale entrance with overshoot
- `animate-slide-up` — fade + translate entrance
- `animate-wiggle` — error shake (500ms)
- `animate-pulse-soft` — subtle glow pulse on clay cards
- `animate-confetti` — falling particle (3s, used on perfect score)
- All animations disabled when `prefers-reduced-motion: reduce`

### No Dark Mode
Children's app — light background only. No dark mode variants needed.

## Content Sources

Lesson content was extracted from NotebookLM using the `query-nlm` skill:
- **Notebook ID**: `c70c41ca-f133-46ef-8c32-069cda21c7f8` ("Tahun 1")
- **Source 1**: `BAHASA_INGGERIS_TAHUN_1.pdf` — primary English Year 1 textbook (Super Minds Student Book 1)
- **Source 2**: `BI_WORKBOOK_TAHUN_1.pdf` — workbook (Super Minds Workbook 1)
- Content aligned to Malaysian KSSR Year 1 English syllabus covering 9 official units + supplementary material

To add more content:
1. Use `/query-nlm <notebook-id>` to extract new lesson data
2. Add a new `LessonTopic` entry to `src/data/lessons.ts`:
```typescript
{
  unit: 16, title: 'New Topic',
  words: ['word1', 'word2', ...],
  phrases: ['Phrase one.', 'Phrase two.'],
  sentences: ['Sentence with ___ .'],
  phonics: [{ sound: 'ch', words: ['chair', 'chips'] }],
}
```

## How to Add a New Game

1. Create `src/games/YourGame.tsx` implementing `GameProps` (see contract above)
2. Add definition to `GAME_DEFINITIONS[]` in `src/utils/types.ts`
3. Import and register in `src/App.tsx`:
```typescript
// Add import
import YourGame from './games/YourGame'
// Add to gameComponents
yourgame: YourGame,
// Add to GAME_ICONS (pick a Lucide icon)
yourgame: Gamepad2,
```

## How to Add a Badge

Edit `src/data/badges.ts`:
```typescript
{
  id: 'my_badge',           // unique string
  name: 'My Badge',          // display name
  icon: '🏅',               // emoji (badges use emoji for display)
  description: 'Do X to earn this',
  conditionMet: (s) => s.totalCorrect >= 50,  // check against GameStats
}
```

## Commands

```bash
npm run dev          # Start dev server at localhost:5173/gamifyschool/
npm run build        # Type-check + produce dist/
npm run preview      # Serve dist/ locally
npm run deploy       # Build + publish to gh-pages branch → GitHub Pages
npx tsc -b           # TypeScript type-check only (no emit)
```

## Deployment

```bash
git add -A
git commit -m "message"
git push
npm run deploy
```

Live at `https://drfittri.github.io/gamifyschool/` within ~30s.

## Gotchas

- **TypeScript strict mode**: `verbatimModuleSyntax` is on — use `import type { X }` for type-only imports
- **HashRouter required**: GitHub Pages doesn't support SPA fallback for `BrowserRouter`. All routes are `/#/path`
- **Vite base path**: `vite.config.ts` sets `base: '/gamifyschool/'` — must match repo name
- **localStorage key**: `gamifyschool_stats` — changing structure requires migration logic
- **Emoji maps**: Each game file has its own `WORD_EMOJI` map. Duplicate keys (e.g. `chicken` appears twice) cause TS errors. If adding new words, check for conflicts.
- **GameWrapper.tsx**: Legacy component, not used in current App.tsx. Safe to delete or repurpose.
- **useSound.ts**: Browser TTS (SpeechSynthesis) may not work on all browsers. Web Audio oscillator fallback is always available.
- **IndexedDB not used**: No service worker, no offline support currently. All state is React `useState` + `localStorage`.
