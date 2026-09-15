import { useEffect, useMemo, useRef, useState } from 'react'
import { playCorrect, playWrong, playClick, playExplosion, playComboStreak, playFanfare, playLevelUp, playMissionSting, playWarn, speak } from '../hooks/useSound'
import { Compass, Volume2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Ear, Skull, Anchor } from 'lucide-react'
import { makeRounds, type Round } from './shared/wordBank'
import { GameHud, MissionBriefing } from './shared/arcade/GameHud'
import { comboCallout } from './shared/arcade/engine'
import { qaExpose } from './shared/qa'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

const GRID = 5
const ISLANDS = [
  { name: 'Palm Cove', obstacles: 5, banner: 'ISLAND 1', sub: 'Palm Cove — find the path!' },
  { name: 'Skull Reef', obstacles: 6, banner: 'ISLAND 2', sub: 'Skull Reef — more rocks ahead!' },
  { name: 'Kraken Bay', obstacles: 7, banner: 'ISLAND 3', sub: 'Kraken Bay — the treasure is near!' },
]
const KRAKEN_HP = 3

function buildGrid(obstacles: number): boolean[][] {
  for (let tries = 0; tries < 50; tries++) {
    const g: boolean[][] = Array.from({ length: GRID }, () => Array(GRID).fill(false))
    let placed = 0
    while (placed < obstacles) {
      const x = Math.floor(Math.random() * GRID), y = Math.floor(Math.random() * GRID)
      if ((x === 0 && y === 0) || (x === GRID - 1 && y === GRID - 1) || g[y][x]) continue
      g[y][x] = true; placed++
    }
    if (pathExists(g, 0, 0)) return g
  }
  return Array.from({ length: GRID }, () => Array(GRID).fill(false))
}

function pathExists(g: boolean[][], sx: number, sy: number): boolean {
  const seen = new Set([`${sx},${sy}`])
  const queue: [number, number][] = [[sx, sy]]
  while (queue.length) {
    const [cx, cy] = queue.shift()!
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID || g[ny][nx] || seen.has(`${nx},${ny}`)) continue
      seen.add(`${nx},${ny}`); queue.push([nx, ny])
    }
  }
  return seen.has(`${GRID - 1},${GRID - 1}`)
}

/** First step of the shortest path from (sx,sy) to the goal, for QA. */
function bestStep(g: boolean[][], sx: number, sy: number): 'up' | 'down' | 'left' | 'right' {
  const dist = new Map<string, number>()
  const prev = new Map<string, string>()
  const start = `${sx},${sy}`
  dist.set(start, 0)
  const queue: [number, number][] = [[sx, sy]]
  while (queue.length) {
    const [cx, cy] = queue.shift()!
    for (const [dx, dy, name] of [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']] as const) {
      const nx = cx + dx, ny = cy + dy
      const key = `${nx},${ny}`
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID || g[ny][nx] || dist.has(key)) continue
      dist.set(key, dist.get(`${cx},${cy}`)! + 1)
      prev.set(key, `${cx},${cy}|${name}`)
      queue.push([nx, ny])
    }
  }
  let cur = `${GRID - 1},${GRID - 1}`
  while (prev.has(cur)) {
    const [from, name] = prev.get(cur)!.split('|')
    if (from === start) return name as 'up' | 'down' | 'left' | 'right'
    cur = from
  }
  return 'right'
}

type Mode = 'question' | 'move' | 'boss' | 'sailing' | 'found'

export default function TreasureMap({ words, onCorrect, onWrong, onComplete }: Props) {
  const [started, setStarted] = useState(false)
  const [island, setIsland] = useState(0)
  const obstacles = useMemo(() => buildGrid(ISLANDS[0].obstacles), [])
  const roundsRef = useRef<Round[]>(makeRounds(words, 40, 4))
  const [roundIdx, setRoundIdx] = useState(0)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [visited, setVisited] = useState<Set<string>>(new Set(['0,0']))
  const [mode, setMode] = useState<Mode>('question')
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [steps, setSteps] = useState(0)
  const [shields, setShields] = useState(3)
  const [krakenHp, setKrakenHp] = useState(KRAKEN_HP)
  const [krakenHit, setKrakenHit] = useState(0)
  const [streak, setStreak] = useState(0)

  const round = roundsRef.current[roundIdx % roundsRef.current.length]
  const prevMode = useRef<Mode | null>(null)

  useEffect(() => {
    if (mode === 'question' && round) speak(round.word)
    if (mode === 'boss' && round) speak(round.word)
    if (mode === 'boss' && prevMode.current !== 'boss') playWarn()
    prevMode.current = mode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIdx, mode])

  // QA exposure
  useEffect(() => {
    if (mode === 'found') { qaExpose({ game: 'treasuremap', phase: 'done' }); return }
    if (mode === 'sailing') { qaExpose({ game: 'treasuremap', phase: 'cinematic' }); return }
    if (!round) return
    qaExpose({
      game: 'treasuremap',
      phase: mode === 'move' ? 'move' : mode === 'boss' ? 'boss' : 'playing',
      word: round.word,
      options: round.options,
      bestMove: mode === 'move' ? bestStep(obstacles, pos.x, pos.y) : undefined,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, roundIdx, pos.x, pos.y, krakenHp])

  const handleAnswer = (opt: string) => {
    if (answered || !round || (mode !== 'question' && mode !== 'boss')) return
    setChosen(opt); setAnswered(true)
    if (opt === round.word) {
      playCorrect(); onCorrect()
      const newStreak = streak + 1
      setStreak(newStreak)
      const callout = comboCallout(newStreak)
      if (callout) { playComboStreak(newStreak) }
      if (mode === 'boss') {
        playExplosion(0.5)
        setKrakenHit(h => h + 1)
        const hp = krakenHp - 1
        setTimeout(() => {
          setKrakenHp(hp)
          if (hp <= 0) {
            playLevelUp()
            setMode('found')
          } else {
            setAnswered(false); setChosen(null); setRoundIdx(i => i + 1)
          }
        }, 800)
      } else {
        setTimeout(() => { setMode('move'); setAnswered(false); setChosen(null) }, 600)
      }
    } else {
      playWrong(); onWrong()
      setStreak(0)
      setShields(s => Math.max(0, s - 1))
      setTimeout(() => { setAnswered(false); setChosen(null); setRoundIdx(i => i + 1) }, 1300)
    }
  }

  const canMove = (dx: number, dy: number) => {
    const nx = pos.x + dx, ny = pos.y + dy
    return nx >= 0 && nx < GRID && ny >= 0 && ny < GRID && !obstacles[ny][nx]
  }

  const move = (dx: number, dy: number) => {
    if (mode !== 'move' || !canMove(dx, dy)) return
    playClick()
    const nx = pos.x + dx, ny = pos.y + dy
    setPos({ x: nx, y: ny })
    setVisited(v => new Set(v).add(`${nx},${ny}`))
    setSteps(s => s + 1)
    if (nx === GRID - 1 && ny === GRID - 1) {
      if (island < ISLANDS.length - 1) {
        // sail to the next island
        playLevelUp()
        const next = island + 1
        setTimeout(() => {
          setIsland(next)
          // rebuild obstacles for the new island in place
          const fresh = buildGrid(ISLANDS[next].obstacles)
          for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) obstacles[y][x] = fresh[y][x]
          setPos({ x: 0, y: 0 })
          setVisited(new Set(['0,0']))
          setMode('question')
          setRoundIdx(i => i + 1)
        }, 1100)
        setMode('sailing')
      } else {
        // reached the kraken's cove
        setKrakenHp(KRAKEN_HP)
        setMode('boss')
        setRoundIdx(i => i + 1)
      }
    } else {
      setMode('question')
      setRoundIdx(i => i + 1)
    }
  }

  if (mode === 'sailing') {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto clay-card p-8 text-center animate-pop-in">
        <div className="text-7xl animate-float">⛵</div>
        <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          Sailing to {ISLANDS[Math.min(island + 1, ISLANDS.length - 1)].name}…
        </p>
        <div className="flex gap-2 text-4xl">
          {ISLANDS.map((_, i) => <span key={i}>{i <= island ? '🏝️' : '🌊'}</span>)}
        </div>
      </div>
    )
  }

  const islandInfo = ISLANDS[Math.min(island, ISLANDS.length - 1)]

  if (!started) {
    return (
      <MissionBriefing
        title="Pirate Quest"
        callsign="Captain's Secret Map"
        hero="🏴‍☠️"
        gradient="from-amber-950 via-orange-950 to-slate-900"
        orders={[
          { icon: Ear, text: 'Listen to the word and check the picture!' },
          { icon: Compass, text: 'Right answers earn a MOVE across 3 islands!' },
          { icon: Skull, text: 'Then face the KRAKEN — 3 cannon hits win the loot!' },
          { icon: Anchor, text: 'Watch out: wrong answers cost your crew a shield!' },
        ]}
        cta="⚓ Set Sail, Captain!"
        onStart={() => { playMissionSting(); setStarted(true) }}
      />
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3">
      <GameHud
        statIcon={Compass}
        statLabel={`Island ${island + 1}/3 · ${steps} steps`}
        statColor="text-amber-600"
        shields={shields}
        prompt={round && (mode === 'question' || mode === 'boss') ? { emoji: round.emoji, onHear: () => speak(round.word) } : null}
        progress={mode === 'boss' ? `KRAKEN ${krakenHp}/${KRAKEN_HP}` : mode === 'move' ? 'CHOOSE YOUR MOVE' : 'ANSWER TO SAIL'}
      />

      {(mode === 'question' || mode === 'move' || mode === 'found') && (
        <div className="relative bg-gradient-to-br from-sky-300 via-cyan-200 to-blue-300 rounded-3xl border-4 border-white shadow-clay-card p-4 overflow-hidden">
          {/* water shimmer stripes */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden>
            <div className="absolute left-0 right-0 top-6 h-1 bg-white rounded-full animate-pulse-soft" />
            <div className="absolute left-0 right-0 bottom-10 h-1 bg-white rounded-full animate-pulse-soft" style={{ animationDelay: '1s' }} />
          </div>
          <div className="flex flex-col gap-1.5 relative">
            {obstacles.map((row, y) => (
              <div key={y} className="flex gap-1.5">
                {row.map((isObstacle, x) => {
                  const isPlayer = pos.x === x && pos.y === y
                  const isGoal = x === GRID - 1 && y === GRID - 1
                  const wasVisited = visited.has(`${x},${y}`)
                  return (
                    <div key={x}
                      className={`w-[52px] h-[52px] rounded-xl flex items-center justify-center text-2xl transition-all duration-300 border-2 ${
                        isObstacle ? 'bg-emerald-700/30 border-emerald-800/40' :
                        isGoal && island === ISLANDS.length - 1 ? 'bg-amber-200 border-amber-400 shadow-lg' :
                        isGoal ? 'bg-yellow-200 border-yellow-400' :
                        isPlayer ? 'bg-amber-200 border-amber-500 scale-110 shadow-lg' :
                        wasVisited ? 'bg-amber-100/90 border-amber-200' :
                        'bg-amber-50/80 border-amber-100'
                      }`}>
                      {isObstacle ? '🌴' :
                       isPlayer ? '⛵' :
                       isGoal ? (mode === 'found' ? '💎' : island === ISLANDS.length - 1 ? '🐙' : '❌') :
                       wasVisited ? '·' : ''}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          {/* island banner */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-extrabold px-3 py-1 rounded-b-xl shadow" style={{ fontFamily: 'var(--font-display)' }}>
            🏴‍☠️ {islandInfo.name}
          </div>
        </div>
      )}

      {mode === 'boss' && (
        <div className={`w-full clay-card p-5 text-center space-y-3 animate-pop-in ${krakenHit > 0 ? 'animate-wiggle' : ''}`}>
          <div className="flex items-center justify-center gap-4">
            <span className="text-7xl select-none" style={{ filter: krakenHit > 0 ? 'hue-rotate(90deg) brightness(1.4)' : 'none' }}>🐙</span>
            <div className="text-left">
              <p className="text-xl font-extrabold text-clay-text flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <Skull className="w-6 h-6 text-clay-error" /> THE KRAKEN AWAKES!
              </p>
              <p className="text-sm text-clay-text-muted font-bold">Answer right to fire the cannons!</p>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: KRAKEN_HP }, (_, i) => (
                  <span key={i} className={`text-lg ${i < krakenHp ? '' : 'opacity-25 grayscale'}`}>❤️</span>
                ))}
              </div>
            </div>
          </div>
          {krakenHit > 0 && <div className="text-4xl animate-pop-in">💥</div>}
        </div>
      )}

      {(mode === 'question' || mode === 'boss') && round && (
        <div className="clay-card p-4 w-full text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl animate-float">{round.emoji ?? '❔'}</span>
            <button onClick={() => speak(round.word)}
              className="clay-card-interactive flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-clay-text border-3 border-white/80"
              style={{ fontFamily: 'var(--font-display)' }}>
              <Volume2 className="w-6 h-6 text-clay-primary" strokeWidth={2.5} /> Hear it
            </button>
          </div>
          <p className="text-sm text-clay-text-muted font-semibold">
            {mode === 'boss' ? '🎯 Pick the cannonball word to blast the Kraken!' : 'Pick the right word to earn a move toward the ❌!'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {round.options.map((opt, i) => {
              const isRight = opt === round.word
              let cls = 'min-h-[48px] rounded-2xl text-lg font-extrabold transition-all duration-200 border-3'
              if (answered) {
                if (isRight) cls += ' clay-card border-clay-success/30 animate-pop-in'
                else if (chosen === opt) cls += ' bg-clay-error/20 text-clay-error animate-wiggle border-clay-error/30'
                else cls += ' bg-white/30 opacity-40 border-white/20'
              } else cls += ' clay-card-interactive border-white/80'
              return <button key={`${roundIdx}-${i}`} onClick={() => handleAnswer(opt)} disabled={answered} className={cls} style={{ fontFamily: 'var(--font-display)' }}>{opt}</button>
            })}
          </div>
        </div>
      )}

      {mode === 'move' && (
        <div className="clay-card p-4 w-full text-center space-y-2 animate-pop-in">
          <p className="text-lg font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>⛵ Correct! Which way, captain?</p>
          <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
            <div />
            <button data-qa="up" onClick={() => move(0, -1)} disabled={!canMove(0, -1)} className="clay-card-interactive min-h-[52px] rounded-2xl border-3 border-white/80 flex items-center justify-center disabled:opacity-25">
              <ArrowUp className="w-7 h-7 text-clay-primary" strokeWidth={3} />
            </button>
            <div />
            <button data-qa="left" onClick={() => move(-1, 0)} disabled={!canMove(-1, 0)} className="clay-card-interactive min-h-[52px] rounded-2xl border-3 border-white/80 flex items-center justify-center disabled:opacity-25">
              <ArrowLeft className="w-7 h-7 text-clay-primary" strokeWidth={3} />
            </button>
            <div className="flex items-center justify-center text-2xl">⛵</div>
            <button data-qa="right" onClick={() => move(1, 0)} disabled={!canMove(1, 0)} className="clay-card-interactive min-h-[52px] rounded-2xl border-3 border-white/80 flex items-center justify-center disabled:opacity-25">
              <ArrowRight className="w-7 h-7 text-clay-primary" strokeWidth={3} />
            </button>
            <div />
            <button data-qa="down" onClick={() => move(0, 1)} disabled={!canMove(0, 1)} className="clay-card-interactive min-h-[52px] rounded-2xl border-3 border-white/80 flex items-center justify-center disabled:opacity-25">
              <ArrowDown className="w-7 h-7 text-clay-primary" strokeWidth={3} />
            </button>
            <div />
          </div>
        </div>
      )}

      {mode === 'found' && (
        <TreasureFound steps={steps} onComplete={onComplete} />
      )}
    </div>
  )
}

function TreasureFound({ steps, onComplete }: { steps: number; onComplete: () => void }) {
  useEffect(() => {
    playFanfare()
    qaExpose({ game: 'treasuremap', phase: 'done' })
    const t = setTimeout(onComplete, 2800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="clay-card p-6 text-center animate-pop-in space-y-3">
      <div className="text-6xl">💎</div>
      <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Treasure Found!</p>
      <p className="text-clay-text-muted font-bold flex items-center justify-center gap-2">
        <Anchor className="w-5 h-5" /> The Kraken fled! You found the loot in {steps} steps, matey!
      </p>
    </div>
  )
}
