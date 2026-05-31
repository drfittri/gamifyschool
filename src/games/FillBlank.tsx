import { useState, useMemo } from 'react'
import { playCorrect, playWrong } from '../hooks/useSound'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }

const WORD_EMOJI: Record<string, string> = {
  hello: '👋', goodbye: '👋', hi: '🖐️', friend: '👫', teacher: '👩‍🏫', name: '📛', morning: '🌅', afternoon: '☀️',
  head: '🗣️', eyes: '👀', nose: '👃', mouth: '👄', ears: '👂', hands: '🤲', feet: '🦶', hair: '💇', arms: '💪', legs: '🦵',
  father: '👨', mother: '👩', brother: '👦', sister: '👧', baby: '👶', grandfather: '👴', grandmother: '👵', family: '👨‍👩‍👧‍👦', love: '❤️', home: '🏠',
  red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', orange: '🟠', purple: '🟣', pink: '🩷', black: '⚫', white: '⚪', brown: '🟤',
  one: '1️⃣', two: '2️⃣', three: '3️⃣', four: '4️⃣', five: '5️⃣', six: '6️⃣', seven: '7️⃣', eight: '8️⃣', nine: '9️⃣', ten: '🔟',
  cat: '🐱', dog: '🐶', fish: '🐟', bird: '🐦', rabbit: '🐰', duck: '🦆', frog: '🐸', cow: '🐮', horse: '🐴', sheep: '🐑', elephant: '🐘', monkey: '🐵', snake: '🐍', tiger: '🐯',
  book: '📚', pen: '🖊️', pencil: '✏️', ruler: '📏', rubber: '🧹', bag: '🎒', desk: '🪑', notebook: '📓',
  rice: '🍚', bread: '🍞', cake: '🎂', egg: '🥚', milk: '🥛', water: '💧', juice: '🧃', apple: '🍎', banana: '🍌', pizza: '🍕', cheese: '🧀', sandwich: '🥪', sausages: '🌭',
  shirt: '👕', pants: '👖', dress: '👗', shoes: '👟', socks: '🧦', hat: '🎩',
  ball: '⚽', doll: '🪆', car: '🚗', bike: '🚲', kite: '🪁', teddy: '🧸', train: '🚂', plane: '✈️', monster: '👾',
  sing: '🎤', dance: '💃', read: '📖', write: '📝', draw: '🎨', swim: '🏊', run: '🏃', jump: '🦘',
  big: '🐘', small: '🐜', long: '🐍', short: '📏', new: '✨', old: '📜', beautiful: '💐',
}

export default function FillBlankGame({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.slice(0, 8)
  const questions = useMemo(() => {
    if (pool.length < 3) return [{ sentence: 'The picture shows: ___', answer: pool[0], emoji: WORD_EMOJI[pool[0]] || '📝', options: shuffle([pool[0], ...pool.slice(1, 4)]) }]
    return pool.slice(0, 6).map(w => {
      const wrong = shuffle(pool.filter(x => x !== w)).slice(0, 3)
      // Neutral carrier that reads correctly for any word type (noun/verb/adjective)
      // because the picture is the real cue: "The picture shows: ___ ."
      return { sentence: 'The picture shows: ___', answer: w, emoji: WORD_EMOJI[w] || '📝', options: shuffle([w, ...wrong]) }
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
      <div className="clay-card px-5 py-2 text-center border-3 border-purple-200 bg-purple-50 w-full">
        <div className="text-2xl mb-0.5">⚔️🛡️🏹</div>
        <p className="text-base font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          Your warrior needs a battle cry! Fill the missing word to charge into battle!
        </p>
      </div>
      <div className="text-6xl animate-float">{q.emoji}</div>
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
      <div className="text-clay-text-muted text-sm font-semibold">⚔️ Battle cry {index + 1} of {questions.length}</div>
    </div>
  )
}
