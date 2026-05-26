import { useState, useMemo } from 'react'
import { playCorrect, playWrong } from '../hooks/useSound'
import { Crosshair } from 'lucide-react'

interface Props {
  words: string[]
  onCorrect: () => void
  onWrong: () => void
  onComplete: () => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface GrammarQ {
  sentence: string
  options: [string, string]
  answer: string
}

function startsWithVowelSound(word: string): boolean {
  return /^[aeiou]/i.test(word)
}

export default function GrammarBlast({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.slice(0, 12)

  const questions = useMemo(() => {
    const qs: GrammarQ[] = []

    const nounPool = pool.filter(w => w.length >= 3 && !w.includes(' '))

    for (let i = 0; i < 3 && nounPool.length > 0; i++) {
      const w = shuffle([...nounPool])[0]
      const art = startsWithVowelSound(w) ? 'an' : 'a'
      const wrongArt = art === 'a' ? 'an' : 'a'
      qs.push({ sentence: `___ ${w}`, options: [art, wrongArt], answer: art })
    }

    for (let i = 0; i < 3 && nounPool.length > 0; i++) {
      const w = shuffle([...nounPool])[0]
      const isSingular = Math.random() > 0.5
      const subj = isSingular ? `The ${w}` : `The ${w}s`
      const verb = isSingular ? 'is' : 'are'
      const wrongVerb = isSingular ? 'are' : 'is'
      qs.push({ sentence: `${subj} ___ big.`, options: [verb, wrongVerb], answer: verb })
    }

    for (let i = 0; i < 2 && nounPool.length > 0; i++) {
      const w = shuffle([...nounPool])[0]
      const isSingular = Math.random() > 0.5
      const subj = isSingular ? `The ${w}` : `The ${w}s`
      const verb = isSingular ? 'has' : 'have'
      const wrongVerb = isSingular ? 'have' : 'has'
      qs.push({ sentence: `${subj} ___ a name.`, options: [verb, wrongVerb], answer: verb })
    }

    return shuffle(qs).slice(0, 8)
  }, [pool.join(',')])

  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [splash, setSplash] = useState<{ x: number; y: number } | null>(null)
  const [miss, setMiss] = useState(false)

  if (questions.length === 0) {
    return <div className="text-clay-text font-bold text-center p-8">Need more words for this unit!</div>
  }

  const q = questions[index]

  const handleAnswer = (opt: string) => {
    if (answered) return
    setChosen(opt)
    setAnswered(true)
    if (opt === q.answer) {
      playCorrect()
      onCorrect()
      setSplash({ x: 50, y: 50 })
      setTimeout(() => setSplash(null), 700)
    } else {
      playWrong()
      onWrong()
      setMiss(true)
      setTimeout(() => setMiss(false), 700)
    }
    setTimeout(() => {
      if (index + 1 >= questions.length) onComplete()
      else { setIndex(i => i + 1); setChosen(null); setAnswered(false) }
    }, 1000)
  }

  return (
    <div className="flex flex-col items-center gap-5 max-w-lg mx-auto w-full">
      <p className="text-lg font-extrabold text-clay-text-muted text-center" style={{ fontFamily: 'var(--font-display)' }}>Pick the right word to complete the sentence!</p>
      <div className="flex items-center gap-2 text-lg font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
        <Crosshair className="w-6 h-6 text-clay-cta" strokeWidth={2.5} />
        Grammar Blast! {index + 1}/{questions.length}
      </div>

      <div className="clay-card p-6 w-full text-center space-y-5 relative overflow-hidden">
        {splash && (
          <div
            className="absolute pointer-events-none animate-pop-in"
            style={{ left: `${splash.x}%`, top: `${splash.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {[...Array(6)].map((_, i) => (
              <span
                key={i}
                className="absolute inline-block text-lg animate-confetti"
                style={{
                  left: `${Math.cos(i * 60 * Math.PI / 180) * 30}px`,
                  top: `${Math.sin(i * 60 * Math.PI / 180) * 30}px`,
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                &#x1F4A6;
              </span>
            ))}
          </div>
        )}

        <p className={`text-2xl font-extrabold text-clay-text ${miss ? 'animate-wiggle' : ''}`} style={{ fontFamily: 'var(--font-display)' }}>
          {q.sentence}
        </p>

        <div className="flex gap-4 justify-center">
          {q.options.map((opt, i) => {
            let cls = 'min-h-[56px] min-w-[100px] px-6 py-3 rounded-2xl text-xl font-extrabold transition-all duration-200 border-3'
            if (answered) {
              if (opt === q.answer) cls += ' clay-card border-clay-success/30 animate-pop-in'
              else if (chosen === opt) cls += ' bg-clay-error/20 text-clay-error border-clay-error/30'
              else cls += ' bg-white/30 opacity-40 border-white/20'
            } else {
              cls += ' clay-card-interactive border-white/80'
            }
            return (
              <button key={i} onClick={() => handleAnswer(opt)} disabled={answered} className={cls} style={{ fontFamily: 'var(--font-display)' }}>
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-1 flex-wrap justify-center">
        {[...Array(questions.length)].map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < index ? 'bg-clay-success' : i === index && answered ? (chosen === q.answer ? 'bg-clay-success' : 'bg-clay-error') : 'bg-clay-text-muted/20'}`} />
        ))}
      </div>
    </div>
  )
}
