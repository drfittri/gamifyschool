import { useState, useEffect, useMemo, useRef } from 'react'
import { playCorrect, playWrong, playClick, playLevelUp, speak } from '../hooks/useSound'
import { Compass, Volume2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'
import { makeRounds, type Round } from './shared/wordBank'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

const GRID = 5

function buildGrid(): boolean[][] {
  // true = obstacle; regenerate until a path from (0,0) to (4,4) exists
  for (let tries = 0; tries < 50; tries++) {
    const g: boolean[][] = Array.from({ length: GRID }, () => Array(GRID).fill(false))
    let placed = 0
    while (placed < 6) {
      const x = Math.floor(Math.random() * GRID), y = Math.floor(Math.random() * GRID)
      if ((x === 0 && y === 0) || (x === GRID - 1 && y === GRID - 1) || g[y][x]) continue
      g[y][x] = true; placed++
    }
    // BFS solvability check
    const seen = new Set(['0,0'])
    const queue: [number, number][] = [[0, 0]]
    while (queue.length) {
      const [cx, cy] = queue.shift()!
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID || g[ny][nx] || seen.has(`${nx},${ny}`)) continue
        seen.add(`${nx},${ny}`); queue.push([nx, ny])
      }
    }
    if (seen.has(`${GRID - 1},${GRID - 1}`)) return g
  }
  return Array.from({ length: GRID }, () => Array(GRID).fill(false))
}

export default function TreasureMap({ words, onCorrect, onWrong, onComplete }: Props) {
  const obstacles = useMemo(buildGrid, [])
  const roundsRef = useRef<Round[]>(makeRounds(words, 40, 4))
  const [roundIdx, setRoundIdx] = useState(0)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [visited, setVisited] = useState<Set<string>>(new Set(['0,0']))
  const [mode, setMode] = useState<'question' | 'move' | 'found'>('question')
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [steps, setSteps] = useState(0)

  const round = roundsRef.current[roundIdx % roundsRef.current.length]

  useEffect(() => {
    if (mode === 'question' && round) speak(round.word)
  }, [roundIdx, mode])

  const handleAnswer = (opt: string) => {
    if (answered || !round || mode !== 'question') return
    setChosen(opt); setAnswered(true)
    if (opt === round.word) {
      playCorrect(); onCorrect()
      setTimeout(() => { setMode('move'); setAnswered(false); setChosen(null) }, 600)
    } else {
      playWrong(); onWrong()
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
      setMode('found')
      playLevelUp()
      setTimeout(onComplete, 2200)
    } else {
      setMode('question')
      setRoundIdx(i => i + 1)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      <div className="flex items-center gap-2 text-clay-text font-extrabold text-xl" style={{ fontFamily: 'var(--font-display)' }}>
        <Compass className="w-6 h-6 text-amber-600" strokeWidth={2.5} />
        Steps: {steps}
      </div>

      <div className="bg-gradient-to-br from-sky-200 via-cyan-100 to-blue-200 rounded-2xl border-3 border-cyan-300 p-3">
        <div className="flex flex-col gap-1">
          {obstacles.map((row, y) => (
            <div key={y} className="flex gap-1">
              {row.map((isObstacle, x) => {
                const isPlayer = pos.x === x && pos.y === y
                const isGoal = x === GRID - 1 && y === GRID - 1
                const wasVisited = visited.has(`${x},${y}`)
                return (
                  <div key={x}
                    className={`w-[52px] h-[52px] rounded-lg flex items-center justify-center text-2xl transition-all duration-300 border-2 ${
                      isObstacle ? 'bg-emerald-700/30 border-emerald-800/30' :
                      isGoal && mode === 'found' ? 'bg-yellow-300 border-yellow-500 animate-pop-in' :
                      isPlayer ? 'bg-amber-200 border-amber-400 scale-110 shadow-lg' :
                      wasVisited ? 'bg-amber-100/80 border-amber-200' :
                      'bg-amber-50/70 border-amber-100'
                    }`}>
                    {isObstacle ? '🌴' :
                     isPlayer ? '🏴‍☠️' :
                     isGoal ? (mode === 'found' ? '💎' : '❌') :
                     wasVisited ? '·' : ''}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {mode === 'question' && round && (
        <div className="clay-card p-4 w-full text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl animate-float">{round.emoji ?? '❔'}</span>
            <button onClick={() => speak(round.word)}
              className="clay-card-interactive flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-clay-text border-3 border-white/80"
              style={{ fontFamily: 'var(--font-display)' }}>
              <Volume2 className="w-6 h-6 text-clay-primary" strokeWidth={2.5} /> Hear it
            </button>
          </div>
          <p className="text-sm text-clay-text-muted font-semibold">Pick the word to earn a move toward the treasure ❌!</p>
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
            <button onClick={() => move(0, -1)} disabled={!canMove(0, -1)} className="clay-card-interactive min-h-[52px] rounded-2xl border-3 border-white/80 flex items-center justify-center disabled:opacity-25">
              <ArrowUp className="w-7 h-7 text-clay-primary" strokeWidth={3} />
            </button>
            <div />
            <button onClick={() => move(-1, 0)} disabled={!canMove(-1, 0)} className="clay-card-interactive min-h-[52px] rounded-2xl border-3 border-white/80 flex items-center justify-center disabled:opacity-25">
              <ArrowLeft className="w-7 h-7 text-clay-primary" strokeWidth={3} />
            </button>
            <div className="flex items-center justify-center text-2xl">🏴‍☠️</div>
            <button onClick={() => move(1, 0)} disabled={!canMove(1, 0)} className="clay-card-interactive min-h-[52px] rounded-2xl border-3 border-white/80 flex items-center justify-center disabled:opacity-25">
              <ArrowRight className="w-7 h-7 text-clay-primary" strokeWidth={3} />
            </button>
            <div />
            <button onClick={() => move(0, 1)} disabled={!canMove(0, 1)} className="clay-card-interactive min-h-[52px] rounded-2xl border-3 border-white/80 flex items-center justify-center disabled:opacity-25">
              <ArrowDown className="w-7 h-7 text-clay-primary" strokeWidth={3} />
            </button>
            <div />
          </div>
        </div>
      )}

      {mode === 'found' && (
        <div className="clay-card p-6 text-center animate-pop-in space-y-3">
          <div className="text-6xl">💎</div>
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Treasure Found!</p>
          <p className="text-clay-text-muted font-bold">You found it in {steps} steps, matey!</p>
        </div>
      )}
    </div>
  )
}
