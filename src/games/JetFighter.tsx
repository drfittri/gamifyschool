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
  const frameRef = useRef<number>(0)
  const cloudsRef = useRef<WordCloud[]>([])
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(10)
  const maxMisses = 5
  const missesRef = useRef(0)
  const endedRef = useRef(false)
  const gameOverRef = useRef(false)

  const spawnCloud = useCallback(() => {
    const word = pool[Math.floor(Math.random() * pool.length)]
    const correct = Math.random() > 0.35
    const id = nextId.current++
    const newCloud: WordCloud = {
      id,
      word: correct ? word : (pool.filter(w => w !== word)[Math.floor(Math.random() * Math.max(pool.length - 1, 1))] || word),
      x: 10 + Math.random() * 80,
      y: -5,
      correct,
    }
    cloudsRef.current = [...cloudsRef.current, newCloud]
  }, [pool.join(',')])

  useEffect(() => {
    if (gameOverRef.current) return
    const spawnTimer = setInterval(spawnCloud, 1300)
    let lastTime = performance.now()

    const loop = (time: number) => {
      if (gameOverRef.current) return
      const dt = (time - lastTime) / 16
      lastTime = time

      cloudsRef.current = cloudsRef.current
        .map(c => ({ ...c, y: c.y + 0.4 * dt }))
        .filter(c => {
          if (c.y > 95) {
            if (c.correct) {
              missesRef.current += 1
              setMisses(missesRef.current)
              playWrong()
              if (missesRef.current >= maxMisses && !endedRef.current) {
                endedRef.current = true
                gameOverRef.current = true
                setGameOver(true)
                setTimeout(onComplete, 1500)
              }
            }
            return false
          }
          return true
        })

      setClouds([...cloudsRef.current])
      if (!gameOverRef.current) {
        frameRef.current = requestAnimationFrame(loop)
      }
    }

    frameRef.current = requestAnimationFrame(loop)
    return () => {
      clearInterval(spawnTimer)
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  const moveLeft = () => setPlayerX(x => Math.max(5, x - 10))
  const moveRight = () => setPlayerX(x => Math.min(95, x + 10))

  const handleCollect = (cloud: WordCloud) => {
    if (gameOverRef.current) return
    if (cloud.correct) {
      playCorrect(); onCorrect()
      setScore(s => s + 1)
    } else {
      playWrong(); onWrong()
      missesRef.current += 1
      setMisses(missesRef.current)
      if (missesRef.current >= maxMisses && !endedRef.current) {
        endedRef.current = true
        gameOverRef.current = true
        setGameOver(true)
        setTimeout(onComplete, 1500)
      }
    }
    cloudsRef.current = cloudsRef.current.filter(c => c.id !== cloud.id)
    setClouds(cloudsRef.current)
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto">
      {/* Clear instruction card */}
      <div className="clay-card px-5 py-3 w-full text-center">
        <p className="text-base font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          Tap the <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded-lg">✅ GREEN</span> words!
        </p>
        <p className="text-sm text-clay-text-muted font-semibold mt-1">
          Avoid the <span className="text-red-600">❌ red</span> ones!
        </p>
      </div>

      <div className="flex items-center justify-between w-full text-clay-text font-extrabold text-lg px-2" style={{ fontFamily: 'var(--font-display)' }}>
        <span>⭐ Score: {score}</span>
        <span className="text-clay-error">
          {'❤️'.repeat(Math.max(0, maxMisses - misses))}{'🖤'.repeat(misses)}
        </span>
      </div>

      <div
        ref={gameAreaRef}
        className="w-full bg-gradient-to-b from-sky-300 via-sky-100 to-green-200 rounded-2xl border-3 border-clay-surface relative overflow-hidden"
        style={{ height: '340px' }}
        onClick={e => {
          if (!gameAreaRef.current || gameOverRef.current) return
          const rect = gameAreaRef.current.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * 100
          setPlayerX(x)
        }}
      >
        {/* Clouds / words */}
        {clouds.map(c => (
          <button
            key={c.id}
            onClick={e => { e.stopPropagation(); handleCollect(c) }}
            className={`absolute px-3 py-2 rounded-xl text-sm font-extrabold border-2 shadow-md transition-opacity ${
              c.correct
                ? 'bg-green-100 border-green-400 text-green-800 hover:bg-green-200 hover:scale-105'
                : 'bg-red-100 border-red-400 text-red-800 hover:bg-red-200'
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

        {/* Jet */}
        <div
          className="absolute bottom-4 transition-all duration-150 ease-out"
          style={{ left: `${playerX}%`, transform: 'translateX(-50%)' }}
        >
          <JetSVG />
        </div>

        {/* Move buttons */}
        <div className="absolute bottom-1 left-0 right-0 flex justify-between px-3">
          <button
            onClick={e => { e.stopPropagation(); moveLeft() }}
            className="w-12 h-12 rounded-full bg-white/70 border-2 border-white flex items-center justify-center text-xl font-extrabold text-sky-700 hover:bg-white active:scale-90 transition-all shadow"
          >
            ◀
          </button>
          <button
            onClick={e => { e.stopPropagation(); moveRight() }}
            className="w-12 h-12 rounded-full bg-white/70 border-2 border-white flex items-center justify-center text-xl font-extrabold text-sky-700 hover:bg-white active:scale-90 transition-all shadow"
          >
            ▶
          </button>
        </div>
      </div>

      {gameOver && (
        <div className="clay-card p-6 text-center animate-bounce-in space-y-3 w-full">
          <div className="text-6xl animate-sway">{score >= 8 ? '✈️' : '💪'}</div>
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
            {score >= 8 ? '🎉 Ace Pilot!' : '🙌 Mission Done!'}
          </p>
          <p className="text-lg text-clay-text-muted font-bold">⭐ {score} words collected!</p>
        </div>
      )}
    </div>
  )
}

function JetSVG() {
  return (
    <svg width="52" height="28" viewBox="0 0 52 28">
      <ellipse cx="26" cy="14" rx="20" ry="6" fill="#64748B" />
      <polygon points="44,14 52,8 52,20" fill="#334155" />
      <ellipse cx="15" cy="14" rx="8" ry="7" fill="#3B82F6" />
      <rect x="6" y="18" width="7" height="3" rx="1.5" fill="#1E293B" />
      <rect x="6" y="7" width="7" height="3" rx="1.5" fill="#1E293B" />
      <polygon points="0,14 9,9 9,19" fill="#F59E0B" />
      <circle cx="13" cy="14" r="3.5" fill="#93C5FD" />
    </svg>
  )
}
