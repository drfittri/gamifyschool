import { useState, useMemo } from 'react'
import type { LessonTopic } from '../utils/types'
import { playCorrect, playWrong } from '../hooks/useSound'
import { Rocket } from 'lucide-react'

interface Props {
  words: string[]
  unit: LessonTopic
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

export default function PhonicsRocket({ words: _words, unit, onCorrect, onWrong, onComplete }: Props) {
  const questions = useMemo(() => {
    const qs: { sound: string; answer: string; options: string[] }[] = []
    const allPhonics = unit.phonics || []
    for (const { sound, words: pw } of allPhonics) {
      if (pw.length < 3) continue
      const answer = shuffle([...pw])[0]
      const allOtherWords = unit.words.filter(w => !pw.includes(w) && w.length >= 2)
      const distractors = shuffle(allOtherWords).slice(0, 3)
      if (distractors.length >= 3) {
        qs.push({ sound, answer, options: shuffle([answer, ...distractors]) })
      }
    }
    if (qs.length < 4 && unit.words.length >= 6) {
      const pool = shuffle([...unit.words].filter(w => w.length >= 3)).slice(0, 8)
      for (const w of pool.slice(0, 4)) {
        const letter = w[0]
        const distractors = pool.filter(x => x !== w && !x.startsWith(letter)).slice(0, 3)
        if (distractors.length >= 3) {
          qs.push({ sound: letter, answer: w, options: shuffle([w, ...distractors]) })
        }
      }
    }
    return shuffle(qs).slice(0, 6)
  }, [unit])

  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [fuel, setFuel] = useState(0)
  const maxFuel = questions.length

  if (questions.length === 0) {
    return <div className="text-clay-text font-bold text-center p-8">Need more phonics words for this unit!</div>
  }

  const q = questions[index]

  const handleAnswer = (opt: string) => {
    if (answered) return
    setChosen(opt)
    setAnswered(true)
    if (opt === q.answer) {
      playCorrect()
      onCorrect()
      setFuel(f => Math.min(f + 1, maxFuel))
    } else {
      playWrong()
      onWrong()
    }
    setTimeout(() => {
      if (index + 1 >= questions.length) onComplete()
      else { setIndex(i => i + 1); setChosen(null); setAnswered(false) }
    }, 1000)
  }

  const fuelPct = Math.round((fuel / maxFuel) * 100)

  return (
    <div className="flex flex-col items-center gap-4 max-w-lg mx-auto w-full">
      <div className="clay-card px-5 py-2 text-center border-3 border-indigo-200 bg-indigo-50 w-full">
        <div className="text-2xl mb-0.5">🚀🌌⭐</div>
        <p className="text-base font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          Load the right fuel word to blast the rocket into space! Find the word with the target sound!
        </p>
      </div>
      <div className="flex items-center gap-2 text-lg font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
        <Rocket className="w-6 h-6 text-clay-cta" strokeWidth={2.5} />
        Launch {index + 1}/{questions.length}
      </div>

      <div className="w-full bg-clay-surface rounded-2xl p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-clay-text-muted text-sm font-bold">Fuel</span>
          <div className="h-4 bg-clay-cta/20 rounded-full flex-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-500"
              style={{ width: `${fuelPct}%` }}
            />
          </div>
          <span className="text-clay-text font-extrabold text-sm">{fuel}/{maxFuel}</span>
        </div>
        <div className="flex justify-center">
          <Rocket
            className="w-8 h-8 text-clay-cta transition-all duration-500"
            strokeWidth={2.5}
            style={{ transform: `translateY(${-fuel * 4}px)` }}
          />
        </div>
      </div>

      <div className="clay-card p-5 w-full text-center space-y-4">
        <p className="text-clay-text-muted text-sm font-semibold">🛸 Which word has this rocket fuel sound?</p>
        <p className="text-3xl font-extrabold text-clay-primary animate-float" style={{ fontFamily: 'var(--font-display)' }}>
          /{q.sound}/
        </p>
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt, i) => {
            let cls = 'min-h-[52px] px-4 py-3 rounded-2xl text-lg font-extrabold transition-all duration-200 border-3'
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
    </div>
  )
}
