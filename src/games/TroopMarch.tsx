import { useState, useEffect, useCallback } from 'react'
import { playCorrect, playWrong } from '../hooks/useSound'
import { Sword, Medal } from 'lucide-react'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }

const RANKS = ['Private', 'Corporal', 'Sergeant', 'Lieutenant', 'Captain', 'Major', 'Colonel', 'General']

export default function TroopMarch({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.slice(0, 10)
  const [soldiers, setSoldiers] = useState<{ id: number; rank: number }[]>([])
  const [question, setQuestion] = useState<{ word: string; options: string[] } | null>(null)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const maxSoldiers = 10

  const generateQ = useCallback(() => {
    const word = pool[Math.floor(Math.random() * pool.length)]
    const wrongs = shuffle(pool.filter(w => w !== word)).slice(0, 3)
    setQuestion({ word, options: shuffle([word, ...wrongs]) })
    setAnswered(false); setChosen(null)
  }, [pool.join(',')])

  useEffect(() => { if (soldiers.length < maxSoldiers) generateQ() }, [soldiers.length])

  const handleAnswer = (opt: string) => {
    if (answered || !question) return
    setChosen(opt); setAnswered(true)
    if (opt === question.word) {
      playCorrect(); onCorrect()
      setTimeout(() => {
        const rank = Math.min(soldiers.length, RANKS.length - 1)
        setSoldiers(s => [...s, { id: s.length, rank }])
        if (soldiers.length + 1 >= maxSoldiers) setTimeout(onComplete, 600)
      }, 400)
    } else {
      playWrong(); onWrong()
      if (soldiers.length > 0) {
        setTimeout(() => { setSoldiers(s => s.slice(0, -1)) }, 500)
      }
      setTimeout(() => {
        if (soldiers.length >= maxSoldiers) onComplete()
      }, 800)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xl mx-auto">
      <div className="flex items-center gap-2 text-clay-text font-extrabold text-xl" style={{ fontFamily: 'var(--font-display)' }}>
        <Sword className="w-6 h-6 text-clay-primary" strokeWidth={2.5} />
        Army: {soldiers.length}/{maxSoldiers}
      </div>

      <div className="w-full bg-gradient-to-b from-emerald-50 to-green-100 rounded-2xl border-3 border-clay-surface p-3 overflow-hidden" style={{ minHeight: '100px' }}>
        <div className="flex flex-wrap gap-1 justify-start items-end min-h-[70px]">
          {soldiers.map(s => (
            <div key={s.id} className="animate-pop-in flex flex-col items-center" style={{ animationDelay: `${s.id * 50}ms` }}>
              <div className="text-xs font-extrabold text-clay-text-muted mb-0.5">{RANKS[s.rank]}</div>
              <SoldierSVG rank={s.rank} />
            </div>
          ))}
          {soldiers.length === 0 && (
            <div className="text-clay-text-muted font-semibold text-center w-full py-6">Answer correctly to recruit soldiers!</div>
          )}
        </div>
      </div>

      {question && soldiers.length < maxSoldiers && (
        <div className="clay-card p-4 w-full text-center space-y-3">
          <p className="text-lg text-clay-text-muted font-semibold">Recruit a soldier!</p>
          <p className="text-3xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="text-5xl mr-2">🪖</span> {question.word}
          </p>
          <p className="text-sm text-clay-text-muted font-semibold">Pick the matching word:</p>
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
      )}

      {soldiers.length >= maxSoldiers && (
        <div className="clay-card p-6 text-center animate-pop-in space-y-3">
          <div className="text-6xl">🏅</div>
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
            Army Complete!
          </p>
          <p className="text-lg text-clay-text-muted font-bold">
            <Medal className="w-5 h-5 inline text-clay-yellow" strokeWidth={2.5} /> Rank: {RANKS[Math.min(soldiers.length - 1, RANKS.length - 1)]}!
          </p>
        </div>
      )}
    </div>
  )
}

function SoldierSVG({ rank }: { rank: number }) {
  const color = ['#6B7280', '#4B5563', '#374151', '#1F2937', '#111827', '#D97706', '#DC2626', '#7C3AED'][rank]
  return (
    <svg width="28" height="40" viewBox="0 0 28 40">
      <circle cx="14" cy="8" r="7" fill={color} />
      <rect x="7" y="15" width="14" height="12" rx="3" fill={color} />
      <rect x="3" y="27" width="8" height="10" rx="2" fill={color} />
      <rect x="17" y="27" width="8" height="10" rx="2" fill={color} />
      <rect x="9" y="16" width="4" height="8" rx="1" fill="#FBBF24" />
      <rect x="5" y="29" width="4" height="4" rx="1" fill="#111" />
      <rect x="19" y="29" width="4" height="4" rx="1" fill="#111" />
      {rank >= 7 && <circle cx="14" cy="6" r="3" fill="#FBBF24" />}
    </svg>
  )
}
