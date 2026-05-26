import { useState, useEffect, useCallback } from 'react'
import { playCorrect, playWrong } from '../hooks/useSound'
import { Crosshair } from 'lucide-react'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }

const SPLASH_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

export default function TargetBlast({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.slice(0, 14)
  const [targets, setTargets] = useState<{ id: number; word: string; x: number; y: number; hit: boolean; missed: boolean }[]>([])
  const [activeTarget, setActiveTarget] = useState<number | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [answered, setAnswered] = useState(false)
  const maxRounds = 8
  const [gameOver, setGameOver] = useState(false)

  const spawnTargets = useCallback(() => {
    const count = 4
    const newTargets: { id: number; word: string; x: number; y: number; hit: boolean; missed: boolean }[] = []
    const chosen = shuffle([...pool]).slice(0, count)
    for (let i = 0; i < count; i++) {
      newTargets.push({
        id: i, word: chosen[i],
        x: 10 + Math.random() * 70,
        y: 15 + Math.random() * 55,
        hit: false, missed: false,
      })
    }
    setTargets(newTargets)
    const active = newTargets[Math.floor(Math.random() * count)]
    setActiveTarget(active.id)
    const wrongs = shuffle(newTargets.filter(t => t.id !== active.id).map(t => t.word)).slice(0, 2)
    const rightWord = active.word
    setOptions(shuffle([rightWord, ...wrongs, ...shuffle(pool.filter(w => !newTargets.find(t => t.word === w))).slice(0, 1)].slice(0, 3)))
    setAnswered(false)
  }, [pool.join(',')])

  useEffect(() => { if (!gameOver && round < maxRounds) spawnTargets() }, [round, gameOver])

  const handleShoot = (opt: string) => {
    if (answered || gameOver || activeTarget === null) return
    setAnswered(true)
    const target = targets.find(t => t.id === activeTarget)!
    if (opt === target.word) {
      playCorrect(); onCorrect(); setScore(s => s + 1)
      setTargets(prev => prev.map(t => t.id === activeTarget ? { ...t, hit: true } : t))
      setTimeout(() => {
        if (round + 1 >= maxRounds) { setGameOver(true); setTimeout(onComplete, 1500) }
        else setRound(r => r + 1)
      }, 800)
    } else {
      playWrong(); onWrong()
      setTargets(prev => prev.map(t => t.id === activeTarget ? { ...t, missed: true } : t))
      setTimeout(() => {
        if (round + 1 >= maxRounds) { setGameOver(true); setTimeout(onComplete, 1500) }
        else setRound(r => r + 1)
      }, 1000)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-lg mx-auto">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 text-clay-text font-extrabold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
          <Crosshair className="w-5 h-5 text-clay-cta" strokeWidth={2.5} /> Score: {score}
        </div>
        <span className="text-clay-text-muted font-semibold text-sm">Round {round + 1}/{maxRounds}</span>
      </div>

      <div className="w-full bg-gradient-to-b from-sky-100 to-green-100 rounded-2xl border-3 border-clay-surface relative overflow-hidden" style={{ height: '260px' }}>
        {targets.map(t => (
          <div
            key={t.id}
            className={`absolute transition-all duration-500 ${activeTarget === t.id ? 'scale-110 z-10' : 'scale-90 opacity-60'}`}
            style={{
              left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)',
            }}
          >
            <svg width="64" height="64" viewBox="0 0 64 64" className={!t.hit && !t.missed ? 'animate-float' : ''}>
              <circle cx="32" cy="32" r="30" fill={t.hit ? '#D1FAE5' : t.missed ? '#FEE2E2' : 'white'} stroke={t.hit ? '#10B981' : '#F59E0B'} strokeWidth="3" />
              <circle cx="32" cy="32" r="22" fill={t.hit ? '#A7F3D0' : 'white'} stroke={t.hit ? '#34D399' : '#F59E0B'} strokeWidth="2" />
              <circle cx="32" cy="32" r="14" fill={t.hit ? '#6EE7B7' : '#FEF3C7'} stroke={t.hit ? '#6EE7B7' : '#F59E0B'} strokeWidth="2" />
              <circle cx="32" cy="32" r="6" fill={t.hit ? '#34D399' : '#FCD34D'} />
              {t.hit && (
                <>
                  <circle cx="32" cy="32" r="35" fill={SPLASH_COLORS[Math.floor(Math.random() * SPLASH_COLORS.length)]} opacity="0.3" className="animate-pop-in" />
                  <text x="32" y="38" textAnchor="middle" fontSize="20" className="animate-pop-in">💦</text>
                </>
              )}
              {t.missed && <text x="32" y="38" textAnchor="middle" fontSize="16" className="animate-wiggle">❌</text>}
            </svg>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white/90 px-2 py-0.5 rounded-full text-xs font-extrabold text-clay-text shadow-sm whitespace-nowrap" style={{ fontFamily: 'var(--font-display)' }}>
              {t.word}
            </div>
          </div>
        ))}
        {activeTarget !== null && !answered && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-clay-cta/20 text-clay-cta px-3 py-1 rounded-full text-xs font-extrabold">
            Shoot this target!
          </div>
        )}
      </div>

      {!gameOver && (
        <div className="flex gap-3 justify-center flex-wrap">
          {options.map((opt, i) => (
            <button key={i} onClick={() => handleShoot(opt)} disabled={answered}
              className="clay-card-interactive min-h-[50px] px-5 py-3 rounded-2xl text-lg font-extrabold text-clay-text border-3 border-white/80 hover:border-clay-primary transition-all disabled:opacity-50"
              style={{ fontFamily: 'var(--font-display)' }}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {gameOver && (
        <div className="clay-card p-6 text-center animate-pop-in space-y-3">
          <div className="text-6xl">{score >= maxRounds * 0.7 ? '🎯' : '💪'}</div>
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
            {score >= maxRounds * 0.7 ? 'Sharpshooter!' : 'Good effort!'}
          </p>
          <p className="text-lg text-clay-text-muted font-bold">Hits: {score} / {maxRounds}</p>
        </div>
      )}
    </div>
  )
}
