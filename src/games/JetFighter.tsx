import { useState, useEffect, useRef, useCallback } from 'react'
import { playCorrect, playWrong } from '../hooks/useSound'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

interface WordCloud { id: number; word: string; x: number; y: number; correct: boolean }

export default function JetFighter({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.slice(0, 12)
  const [playerX, setPlayerX] = useState(50)
  const [clouds, setClouds] = useState<WordCloud[]>([])
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [ended, setEnded] = useState(false)
  const frameRef = useRef<number>(0)
  const cloudsRef = useRef<WordCloud[]>([])
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(10)
  const maxMisses = 5

  const spawnCloud = useCallback(() => {
    const word = pool[Math.floor(Math.random() * pool.length)]
    const correct = Math.random() > 0.3
    const id = nextId.current++
    const newCloud: WordCloud = {
      id,
      word: correct ? word : pool.filter(w => w !== word)[Math.floor(Math.random() * (pool.length - 1))],
      x: 10 + Math.random() * 80,
      y: -5,
      correct: correct,
    }
    cloudsRef.current = [...cloudsRef.current, newCloud]
  }, [pool.join(',')])

  useEffect(() => {
    if (gameOver || ended) return
    let spawnTimer = setInterval(spawnCloud, 1200)
    let lastTime = performance.now()

    const loop = (time: number) => {
      const dt = (time - lastTime) / 16
      lastTime = time

      cloudsRef.current = cloudsRef.current
        .map(c => ({ ...c, y: c.y + 0.4 * dt }))
        .filter(c => {
          if (c.y > 95) {
            if (c.correct) { setMisses(m => m + 1); playWrong() }
            return false
          }
          return true
        })

      if (misses + cloudsRef.current.filter(c => c.y > 95 && c.correct).length >= maxMisses) {
        setGameOver(true)
        if (!ended) { setEnded(true); setTimeout(onComplete, 1500) }
        return
      }

      setClouds([...cloudsRef.current])
      frameRef.current = requestAnimationFrame(loop)
    }

    frameRef.current = requestAnimationFrame(loop)
    return () => {
      clearInterval(spawnTimer)
      cancelAnimationFrame(frameRef.current)
    }
  }, [gameOver, ended])

  const moveLeft = () => setPlayerX(x => Math.max(5, x - 10))
  const moveRight = () => setPlayerX(x => Math.min(95, x + 10))

  const handleCollect = (cloud: WordCloud) => {
    if (gameOver || ended) return
    if (cloud.correct) {
      playCorrect(); onCorrect()
      setScore(s => s + 1)
    } else {
      playWrong(); onWrong()
      const newMisses = misses + 1
      setMisses(newMisses)
      if (newMisses >= maxMisses) { setGameOver(true); setEnded(true); setTimeout(onComplete, 1500) }
    }
    cloudsRef.current = cloudsRef.current.filter(c => c.id !== cloud.id)
    setClouds(cloudsRef.current)
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto">
      <p className="text-base font-extrabold text-clay-text-muted text-center" style={{ fontFamily: 'var(--font-display)' }}>Catch the checkmarked words, avoid the X words!</p>
      <div className="flex items-center justify-between w-full text-clay-text font-extrabold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
        <span>Score: {score}</span>
        <span className="text-clay-error">Misses: {misses}/{maxMisses}</span>
      </div>

      <div ref={gameAreaRef} className="w-full bg-gradient-to-b from-sky-300 via-sky-100 to-green-200 rounded-2xl border-3 border-clay-surface relative overflow-hidden" style={{ height: '360px' }}
        onClick={e => {
          if (!gameAreaRef.current || gameOver) return
          const rect = gameAreaRef.current.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * 100
          setPlayerX(x)
        }}>
        <div className="absolute top-2 left-2 text-sm font-bold text-sky-800/30">Move: click or tap sides</div>

        {clouds.map(c => (
          <button
            key={c.id}
            onClick={() => handleCollect(c)}
            className={`absolute px-3 py-2 rounded-xl text-sm font-extrabold border-2 transition-opacity animate-slide-up shadow-sm ${
              c.correct ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200' : 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200'
            }`}
            style={{
              left: `${c.x}%`, top: `${c.y}%`,
              transform: 'translate(-50%, -50%)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {c.correct ? '✅' : '❌'} {c.word}
          </button>
        ))}

        <div
          className="absolute bottom-4 transition-all duration-150 ease-out"
          style={{ left: `${playerX}%`, transform: 'translateX(-50%)' }}
        >
          <JetSVG />
        </div>

        <div className="absolute bottom-1 left-0 right-0 flex justify-between px-3">
          <button onClick={moveLeft} className="w-12 h-12 rounded-full bg-white/60 border-2 border-white flex items-center justify-center text-xl font-extrabold text-sky-700 hover:bg-white active:scale-90 transition-all">&#9664;</button>
          <button onClick={moveRight} className="w-12 h-12 rounded-full bg-white/60 border-2 border-white flex items-center justify-center text-xl font-extrabold text-sky-700 hover:bg-white active:scale-90 transition-all">&#9654;</button>
        </div>
      </div>

      {gameOver && (
        <div className="clay-card p-6 text-center animate-pop-in space-y-3 w-full">
          <div className="text-6xl">{score >= 8 ? '✈️' : '💪'}</div>
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
            {score >= 8 ? 'Ace Pilot!' : 'Mission Complete!'}
          </p>
          <p className="text-lg text-clay-text-muted font-bold">Score: {score} words collected</p>
        </div>
      )}
    </div>
  )
}

function JetSVG() {
  return (
    <svg width="48" height="24" viewBox="0 0 48 24">
      <ellipse cx="24" cy="12" rx="18" ry="5" fill="#64748B" />
      <polygon points="40,12 48,7 48,17" fill="#334155" />
      <ellipse cx="14" cy="12" rx="7" ry="6" fill="#3B82F6" />
      <rect x="6" y="15" width="6" height="3" rx="1.5" fill="#1E293B" />
      <rect x="6" y="6" width="6" height="3" rx="1.5" fill="#1E293B" />
      <polygon points="0,12 8,8 8,16" fill="#F59E0B" />
      <circle cx="12" cy="12" r="3" fill="#93C5FD" />
    </svg>
  )
}
