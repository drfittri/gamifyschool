import { useState, useEffect, useCallback } from 'react'
import { playCorrect, playWrong, playClick } from '../hooks/useSound'
import { Rocket, Zap } from 'lucide-react'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

export default function RocketLaunch({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.slice(0, 8)
  const [question, setQuestion] = useState<string | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [fuel, setFuel] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [launched, setLaunched] = useState(false)
  const [questionsAsked, setQuestionsAsked] = useState(0)
  const maxFuel = 10

  const generateQ = useCallback(() => {
    const word = pool[Math.floor(Math.random() * pool.length)]
    setQuestion(word)
    const wrongs = pool.filter(w => w !== word).slice(0, 3)
    setOptions([word, ...wrongs].sort(() => Math.random() - 0.5))
    setAnswered(false); setChosen(null)
  }, [pool.join(',')])

  useEffect(() => { if (fuel < maxFuel && !launched) generateQ() }, [fuel, launched])

  const handleAnswer = (opt: string) => {
    if (answered || launched || !question) return
    setChosen(opt); setAnswered(true)
    setQuestionsAsked(q => q + 1)
    if (opt === question) {
      playCorrect(); onCorrect()
      setTimeout(() => {
        const newFuel = fuel + 1
        setFuel(newFuel)
        if (newFuel >= maxFuel) { setLaunched(true); playClick(); setTimeout(onComplete, 3000) }
      }, 400)
    } else {
      playWrong(); onWrong()
      setTimeout(() => { if (fuel >= maxFuel) onComplete() }, 600)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      <div className="flex items-center gap-3 text-clay-text font-extrabold text-xl" style={{ fontFamily: 'var(--font-display)' }}>
        <Rocket className={`w-6 h-6 transition-colors ${launched ? 'text-clay-cta' : 'text-clay-primary'}`} strokeWidth={2.5} />
        Fuel: {fuel}/{maxFuel}
      </div>

      <div className="w-full bg-gradient-to-b from-indigo-950 via-purple-900 to-black rounded-2xl border-3 border-clay-surface p-4 relative overflow-hidden space-y-3" style={{ minHeight: '280px' }}>
        <StarField />
        <div className="relative h-[160px] flex items-end justify-center">
          <div
            className={`transition-all duration-1000 ease-out ${launched ? 'animate-slide-up' : ''}`}
            style={{
              transform: launched ? 'translateY(-200px)' : `translateY(${-fuel * 12}px)`,
              opacity: launched ? 1 : 1,
            }}
          >
            <RocketSVG launched={launched} fuel={fuel} />
          </div>
        </div>
        <div className="clay-surface px-3 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-5 bg-white/60 rounded-full overflow-hidden border-2 border-white">
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${(fuel / maxFuel) * 100}%`,
                background: 'linear-gradient(90deg, #F97316, #EF4444, #7C3AED)',
              }} />
            </div>
            <Zap className="w-5 h-5 text-clay-yellow" strokeWidth={2.5} />
          </div>
        </div>
        <div className="flex gap-2 justify-center">
          {[...Array(maxFuel)].map((_, i) => (
            <div key={i} className={`w-3 h-6 rounded-sm transition-all ${i < fuel ? 'bg-clay-cta' : 'bg-white/20'} ${i === fuel - 1 ? 'animate-pulse-soft' : ''}`} />
          ))}
        </div>
      </div>

      {!launched && question && (
        <div className="clay-card p-4 w-full text-center space-y-3">
          <p className="text-lg text-clay-text-muted font-semibold">Fuel the rocket!</p>
          <p className="text-3xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>{question}</p>
          <div className="grid grid-cols-2 gap-2">
            {options.map((opt, i) => {
              const isRight = opt === question
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

      {launched && (
        <div className="clay-card p-6 text-center animate-pop-in space-y-3">
          <div className="text-7xl">🚀</div>
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>We Have Liftoff!</p>
          <p className="text-clay-text-muted font-bold">Questions answered: {questionsAsked}</p>
        </div>
      )}
    </div>
  )
}

function RocketSVG({ launched, fuel }: { launched: boolean; fuel: number }) {
  return (
    <svg width="40" height="80" viewBox="0 0 40 80" className={launched ? '' : 'animate-float'}>
      <ellipse cx="20" cy="35" rx="12" ry="25" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="2" />
      <ellipse cx="20" cy="20" rx="10" ry="12" fill="#EF4444" />
      <circle cx="20" cy="20" r="5" fill="#FCA5A5" />
      <rect x="16" y="28" width="8" height="15" rx="2" fill="#3B82F6" />
      <polygon points="12,55 20,75 28,55" fill="#F59E0B" />
      <polygon points="14,55 20,65 26,55" fill="#FCD34D" />
      <rect x="5" y="50" width="6" height="14" rx="3" fill="#EF4444" opacity="0.8" />
      <rect x="29" y="50" width="6" height="14" rx="3" fill="#EF4444" opacity="0.8" />
      <rect x="3" y="55" width="6" height="6" rx="2" fill="#FBBF24" />
      <rect x="31" y="55" width="6" height="6" rx="2" fill="#FBBF24" />
      {fuel >= 5 && <circle cx="5" cy="60" r="3" fill="#F97316" opacity="0.6" className="animate-sparkle" />}
      {fuel >= 8 && <circle cx="35" cy="58" r="4" fill="#EF4444" opacity="0.5" className="animate-sparkle" />}
    </svg>
  )
}

function StarField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-sparkle"
          style={{
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${1 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  )
}
