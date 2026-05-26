import { useState, useMemo } from 'react'
import { playCorrect, playWrong } from '../hooks/useSound'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }

export default function FillBlankGame({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.slice(0, 8)
  const questions = useMemo(() => {
    if (pool.length < 3) return [{ sentence: 'I like ___ !', answer: pool[0], options: shuffle(pool.slice(0, 4)) }]
    return pool.slice(0, 6).map(w => {
      const wrong = shuffle(pool.filter(x => x !== w)).slice(0, 3)
      const templates = ['I like ___ .', 'The ___ is nice.', 'This is a ___ .', 'I have a ___ .', 'Look at the ___ .']
      const t = templates[Math.floor(Math.random() * templates.length)]
      return { sentence: t, answer: w, options: shuffle([w, ...wrong]) }
    })
  }, [words.join(',')])

  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  if (questions.length === 0) return <div className="text-clay-text font-bold">No questions!</div>
  const q = questions[index]

  const handleChoose = (opt: string) => {
    if (answered) return; setChosen(opt); setAnswered(true)
    if (opt === q.answer) { playCorrect(); onCorrect() } else { playWrong(); onWrong() }
    setTimeout(() => { if (index + 1 >= questions.length) onComplete(); else setIndex(index + 1); setChosen(null); setAnswered(false) }, 1000)
  }

  return (
    <div className="flex flex-col items-center gap-5 max-w-md mx-auto w-full">
      <div className="text-2xl font-extrabold text-clay-text text-center bg-clay-surface px-6 py-5 rounded-2xl w-full" style={{ fontFamily: 'var(--font-display)' }}>
        {q.sentence.split('___').map((part, i) => (
          <span key={i}>
            {part}
            {i < 1 && (
              <span className={`inline-block min-w-[90px] mx-2 px-3 py-1.5 rounded-xl text-xl font-extrabold ${
                answered ? (chosen === q.answer ? 'clay-card border-3 border-clay-success/30 animate-pop-in' : 'bg-clay-error/20 text-clay-error border-3 border-clay-error/30') : 'bg-white/60 border-3 border-dashed border-clay-primary-light/40'
              }`} style={{ fontFamily: 'var(--font-display)' }}>
                {answered ? chosen : '???'}
              </span>
            )}
          </span>
        ))}
      </div>
      {!answered && (
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => handleChoose(opt)} className="clay-card-interactive min-h-[54px] rounded-2xl text-lg font-extrabold text-clay-text border-3 border-white/80" style={{ fontFamily: 'var(--font-display)' }}>
              {opt}
            </button>
          ))}
        </div>
      )}
      <div className="text-clay-text-muted text-sm font-semibold">{index + 1} of {questions.length}</div>
    </div>
  )
}
