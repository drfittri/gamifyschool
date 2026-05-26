import { useState, useEffect, useCallback } from 'react'
import { playCorrect, playWrong, playClick } from '../hooks/useSound'
import { Compass, Anchor } from 'lucide-react'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }

const GRID_SIZE = 5

export default function TreasureMap({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.slice(0, 10)
  const [grid, setGrid] = useState<{ type: 'empty' | 'obstacle' | 'treasure' }[][]>([])
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 })
  const [question, setQuestion] = useState<{ word: string; options: string[] } | null>(null)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [found, setFound] = useState(false)
  const [steps, setSteps] = useState(0)

  useEffect(() => {
    const g: { type: 'empty' | 'obstacle' | 'treasure' }[][] = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => ({ type: 'empty' }))
    )
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * GRID_SIZE)
      const y = Math.floor(Math.random() * GRID_SIZE)
      if ((x !== 0 || y !== 0) && (x !== GRID_SIZE - 1 || y !== GRID_SIZE - 1)) g[y][x] = { type: 'obstacle' }
    }
    g[GRID_SIZE - 1][GRID_SIZE - 1] = { type: 'treasure' }
    setGrid(g)
  }, [])

  const generateQ = useCallback(() => {
    const word = pool[Math.floor(Math.random() * pool.length)]
    const wrongs = shuffle(pool.filter(w => w !== word)).slice(0, 3)
    setQuestion({ word, options: shuffle([word, ...wrongs]) })
    setAnswered(false); setChosen(null)
  }, [pool.join(',')])

  const handleAnswer = (opt: string) => {
    if (answered || !question) return
    setChosen(opt); setAnswered(true)
    if (opt === question.word) {
      playCorrect(); onCorrect(); setSteps(s => s + 1)
      setTimeout(() => {
        const moves = [
          { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
        ].filter(m => {
          const nx = playerPos.x + m.dx; const ny = playerPos.y + m.dy
          return nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && grid[ny][nx]?.type !== 'obstacle'
        })
        if (moves.length > 0) {
          const move = moves[Math.floor(Math.random() * moves.length)]
          const nx = playerPos.x + move.dx; const ny = playerPos.y + move.dy
          setPlayerPos({ x: nx, y: ny })
          if (nx === GRID_SIZE - 1 && ny === GRID_SIZE - 1) {
            setFound(true); playClick(); setTimeout(onComplete, 2000)
          }
        }
      }, 500)
    } else {
      playWrong(); onWrong()
      setTimeout(() => { if (!found) generateQ() }, 800)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      <div className="flex items-center gap-2 text-clay-text font-extrabold text-xl" style={{ fontFamily: 'var(--font-display)' }}>
        <Compass className="w-6 h-6 text-amber-600" strokeWidth={2.5} />
        Steps: {steps}
      </div>

      <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl border-3 border-amber-200 p-3">
        <div className="flex flex-col gap-1">
          {grid.map((row, y) => (
            <div key={y} className="flex gap-1">
              {row.map((cell, x) => {
                const isPlayer = playerPos.x === x && playerPos.y === y
                const isTreasure = GRID_SIZE - 1 === x && GRID_SIZE - 1 === y && found
                return (
                  <div
                    key={x}
                    className={`w-[52px] h-[52px] rounded-lg flex items-center justify-center text-2xl transition-all duration-300 border-2 ${
                      cell.type === 'obstacle' ? 'bg-amber-700/20 border-amber-800/30' :
                      isTreasure ? 'bg-yellow-300 border-yellow-500 animate-pop-in' :
                      isPlayer ? 'bg-sky-200 border-sky-400 scale-110 shadow-lg' :
                      'bg-white/60 border-amber-200'
                    }`}
                  >
                    {cell.type === 'obstacle' ? '💀' :
                     isTreasure ? '💎' :
                     isPlayer ? '🏴‍☠️' :
                     (x === GRID_SIZE - 1 && y === GRID_SIZE - 1 && !found) ? '❓' : ''}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {!found ? (
        question && (
          <div className="clay-card p-4 w-full text-center space-y-3">
            <p className="text-lg text-clay-text-muted font-semibold">Answer to move closer!</p>
            <p className="text-3xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
              <Anchor className="w-6 h-6 inline text-amber-700 mr-1" strokeWidth={2.5} />
              {question.word}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {question.options.map((opt, i) => {
                const isRight = opt === question.word
                let cls = 'min-h-[48px] rounded-2xl text-lg font-extrabold transition-all duration-200 border-3'
                if (answered) {
                  if (isRight) cls += ' clay-card border-clay-success/30 animate-pop-in'
                  else if (chosen === opt) cls += ' bg-clay-error/20 text-clay-error animate-wiggle border-clay-error/30'
                  else cls += ' bg-white/30 opacity-40 border-white/20'
                } else cls += ' clay-card-interactive border-white/80'
                return <button key={i} onClick={() => handleAnswer(opt)} disabled={answered} className={cls} style={{ fontFamily: 'var(--font-display)' }}>{opt}</button>
              })}
            </div>
          </div>
        )
      ) : (
        <div className="clay-card p-6 text-center animate-pop-in space-y-3">
          <div className="text-6xl">💎</div>
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Treasure Found!</p>
          <p className="text-clay-text-muted font-bold">You found it in {steps} steps, matey!</p>
        </div>
      )}
    </div>
  )
}
