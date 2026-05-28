import { useEffect, useRef, useState } from 'react'
import { playCorrect, playWrong, playClick } from '../hooks/useSound'

interface Props {
  words: string[]
  onCorrect: () => void
  onWrong: () => void
  onComplete: () => void
}

const BASE = import.meta.env.BASE_URL
const ASSET = (p: string) => `${BASE}${p.replace(/^\//, '')}`

const RACE_DISTANCE = 100  // virtual meters
const NUM_AI = 3

function pickWord(pool: string[], avoid?: string): string {
  const filtered = pool.filter(w => /^[a-zA-Z]+$/.test(w) && w.length >= 2 && w.length <= 9 && w !== avoid)
  const src = filtered.length ? filtered : ['cat', 'dog', 'sun', 'run', 'red', 'big', 'fast', 'win', 'go']
  return src[Math.floor(Math.random() * src.length)].toLowerCase()
}

export default function SpeedTyping({ words, onCorrect, onWrong, onComplete }: Props) {
  const [started, setStarted] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [target, setTarget] = useState('')
  const [typed, setTyped] = useState('')
  const [playerDist, setPlayerDist] = useState(0)
  const [aiDist, setAiDist] = useState<number[]>([0, 0, 0])
  const [finished, setFinished] = useState(false)
  const [place, setPlace] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const wordsCompletedRef = useRef(0)
  const startTimeRef = useRef(0)

  useEffect(() => {
    if (!started) return
    startTimeRef.current = performance.now()
    setTarget(pickWord(words))
    setTimeout(() => inputRef.current?.focus(), 100)
    // AI loop
    const aiSpeeds = Array.from({ length: NUM_AI }, () => 0.018 + Math.random() * 0.015) // m/ms
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last; last = now
      setAiDist(prev => prev.map((d, i) => Math.min(RACE_DISTANCE, d + aiSpeeds[i] * dt)))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started])

  // Check finish
  useEffect(() => {
    if (!started || finished) return
    const playerDone = playerDist >= RACE_DISTANCE
    const aiDone = aiDist.map(d => d >= RACE_DISTANCE)
    if (playerDone || aiDone.every(Boolean)) {
      // compute place
      const all = [playerDist, ...aiDist].map((d, i) => ({ d, i }))
      all.sort((a, b) => b.d - a.d)
      const p = all.findIndex(x => x.i === 0) + 1
      setPlace(p)
      setFinished(true)
      setTimeout(() => onComplete(), 1500)
    }
  }, [playerDist, aiDist, started, finished])

  const handleSubmit = () => {
    if (!target || finished) return
    if (typed.trim().toLowerCase() === target.toLowerCase()) {
      playCorrect()
      onCorrect()
      wordsCompletedRef.current++
      const boost = 8 + Math.max(0, 12 - target.length)  // shorter word = bigger relative reward; ensures min 8m
      setPlayerDist(d => Math.min(RACE_DISTANCE, d + boost))
      setTyped('')
      setTarget(pickWord(words, target))
    } else {
      playWrong()
      onWrong()
      setTyped('')
      // small stall penalty: -3m but not below current
    }
  }

  if (showInstructions) {
    return (
      <div className="clay-card p-6 max-w-md mx-auto text-center space-y-4">
        <div className="text-6xl">🏎️</div>
        <h2 className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Race Pit Stop</h2>
        <div className="text-clay-text-muted text-base font-semibold space-y-2 text-left">
          <p>🏁 3 AI cars are racing you to the finish line!</p>
          <p>⌨️ Type the word shown to boost your car forward.</p>
          <p>🏆 Cross the finish line first to win 1st place!</p>
        </div>
        <button onClick={() => { setShowInstructions(false); setStarted(true) }} className="clay-button px-8 py-4 text-xl font-extrabold w-full" style={{ fontFamily: 'var(--font-display)' }}>
          🚦 Start Engine!
        </button>
      </div>
    )
  }

  const lanes = [
    { color: '#EF4444', sprite: 'cars/player.png', isPlayer: true, dist: playerDist, label: 'You' },
    { color: '#3B82F6', sprite: 'cars/ai1.png', isPlayer: false, dist: aiDist[0], label: 'AI 1' },
    { color: '#10B981', sprite: 'cars/ai2.png', isPlayer: false, dist: aiDist[1], label: 'AI 2' },
    { color: '#F59E0B', sprite: 'cars/ai3.png', isPlayer: false, dist: aiDist[2], label: 'AI 3' },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-3">
      {/* Race track */}
      <div ref={trackRef} className="relative rounded-2xl overflow-hidden border-4 border-white shadow-clay-card" style={{ background: 'repeating-linear-gradient(to bottom, #444 0 40px, #555 40px 80px)', height: '320px' }}>
        {/* Finish line */}
        <div className="absolute top-0 bottom-0 w-3" style={{ right: '4%', background: 'repeating-linear-gradient(to bottom, #000 0 12px, #fff 12px 24px)' }} />
        {/* Lanes */}
        {lanes.map((lane, i) => {
          const pct = (lane.dist / RACE_DISTANCE) * 92  // leave 8% for finish + margin
          return (
            <div key={i} className="absolute left-0 right-0" style={{ top: `${10 + i * 22}%`, height: '20%' }}>
              {/* Lane divider dashes */}
              {i < lanes.length - 1 && (
                <div className="absolute left-0 right-0 bottom-0 h-0.5" style={{ background: 'repeating-linear-gradient(to right, #fff 0 16px, transparent 16px 28px)' }} />
              )}
              {/* Car */}
              <img
                src={ASSET(`assets/${lane.sprite}`)}
                alt={lane.label}
                className={`absolute transition-all ${lane.isPlayer ? 'duration-300' : 'duration-100'}`}
                style={{ left: `calc(${pct}% + 8px)`, top: '50%', transform: 'translateY(-50%) rotate(90deg)', width: 56, height: 'auto', filter: lane.isPlayer ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' : 'none' }}
                onError={(e) => { (e.currentTarget.style.display = 'none') }}
              />
              {/* Player label */}
              {lane.isPlayer && <span className="absolute left-1 top-1 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-extrabold z-10">YOU</span>}
            </div>
          )
        })}
      </div>

      {/* Word + input */}
      {!finished ? (
        <div className="clay-card p-4 space-y-3">
          <div className="text-center">
            <p className="text-clay-text-muted text-sm font-bold mb-1">Type to boost:</p>
            <p className="text-4xl font-extrabold tracking-widest text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>{target.toUpperCase()}</p>
          </div>
          <input
            ref={inputRef}
            value={typed}
            onChange={(e) => { setTyped(e.target.value); playClick() }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
            className="w-full text-center text-2xl font-extrabold py-3 rounded-2xl border-3 border-clay-primary/30 focus:border-clay-primary outline-none bg-white"
            placeholder="type here..."
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
          />
          <button onClick={handleSubmit} className="clay-button w-full py-3 text-lg font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>🚀 GO!</button>
        </div>
      ) : (
        <div className="clay-card p-6 text-center space-y-2 animate-bounce-in">
          <div className="text-6xl">{place === 1 ? '🏆' : place === 2 ? '🥈' : place === 3 ? '🥉' : '🏁'}</div>
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
            {place === 1 ? '1st place!' : `${place}${place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'} place`}
          </p>
        </div>
      )}
    </div>
  )
}
