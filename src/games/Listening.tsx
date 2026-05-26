import { useState, useEffect } from 'react'
import { playCorrect, playWrong, speak } from '../hooks/useSound'
import { Volume2 } from 'lucide-react'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }

const WORD_EMOJI: Record<string, string> = {
  hello: '👋', goodbye: '👋', hi: '🖐️', friend: '👫', teacher: '👩‍🏫', name: '📛',
  head: '🗣️', eyes: '👀', nose: '👃', mouth: '👄', ears: '👂', hands: '🤲', feet: '🦶',
  father: '👨', mother: '👩', brother: '👦', sister: '👧', baby: '👶', family: '👨‍👩‍👧‍👦', love: '❤️',
  red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', orange: '🟠', purple: '🟣', pink: '🩷', black: '⚫', white: '⚪', brown: '🟤',
  one: '1️⃣', two: '2️⃣', three: '3️⃣', four: '4️⃣', five: '5️⃣', six: '6️⃣', seven: '7️⃣', eight: '8️⃣', nine: '9️⃣', ten: '🔟',
  cat: '🐱', dog: '🐶', fish: '🐟', bird: '🐦', rabbit: '🐰', duck: '🦆', frog: '🐸', cow: '🐮', horse: '🐴', sheep: '🐑', elephant: '🐘', monkey: '🐵', snake: '🐍', tiger: '🐯',
  book: '📚', pen: '🖊️', pencil: '✏️', ruler: '📏', rubber: '🧹', bag: '🎒', desk: '🪑', notebook: '📓',
  rice: '🍚', bread: '🍞', cake: '🎂', egg: '🥚', milk: '🥛', water: '💧', juice: '🧃', apple: '🍎', banana: '🍌', pizza: '🍕', cheese: '🧀', sandwich: '🥪', sausages: '🌭',
  shirt: '👕', pants: '👖', dress: '👗', shoes: '👟', socks: '🧦', hat: '🎩',
  ball: '⚽', doll: '🪆', car: '🚗', bike: '🚲', kite: '🪁', teddy: '🧸', train: '🚂', plane: '✈️', monster: '👾',
  sing: '🎤', dance: '💃', read: '📖', write: '📝', draw: '🎨', swim: '🏊', run: '🏃', jump: '🦘',
}

export default function ListeningGame({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.slice(0, 10)
  const [index, setIndex] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const word = pool[index]

  useEffect(() => {
    const wrong = shuffle(pool.filter(w => w !== word)).slice(0, 3)
    setOptions(shuffle([word, ...wrong]))
    setAnswered(false); setChosen(null)
  }, [index])

  const handleHear = () => speak(word)

  useEffect(() => { if (!answered) { const timer = setTimeout(handleHear, 300); return () => clearTimeout(timer) } }, [index])

  const handleChoose = (opt: string) => {
    if (answered) return; setChosen(opt); setAnswered(true)
    if (opt === word) { playCorrect(); onCorrect() } else { playWrong(); onWrong() }
    setTimeout(() => { if (index + 1 >= pool.length) onComplete(); else setIndex(index + 1) }, 1200)
  }

  const emoji = WORD_EMOJI[word] || '📝'

  return (
    <div className="flex flex-col items-center gap-5 max-w-md mx-auto">
      <div className="text-7xl animate-float">{emoji}</div>
      <div className="text-2xl font-extrabold text-clay-text text-center" style={{ fontFamily: 'var(--font-display)' }}>Listen and pick the right word!</div>
      <button onClick={handleHear} disabled={answered}
        className="clay-card-interactive flex items-center gap-3 px-8 py-4 text-clay-text font-extrabold text-xl border-3 border-white/80 animate-pulse-soft disabled:opacity-50"
        style={{ fontFamily: 'var(--font-display)' }}>
        <Volume2 className="w-7 h-7 text-clay-primary" strokeWidth={2.5} />
        Listen!
      </button>
      <div className="grid grid-cols-2 gap-3 mt-2 w-full max-w-sm">
        {options.map((opt, i) => {
          const isCorrect = opt === word; const isChosen = opt === chosen
          let cls = 'min-h-[56px] rounded-2xl text-lg font-extrabold transition-all duration-300 border-3'
          if (answered) {
            if (isCorrect) cls += ' clay-card border-clay-success/30'
            else if (isChosen) cls += ' bg-clay-error/20 text-clay-error animate-wiggle border-clay-error/30'
            else cls += ' bg-white/40 opacity-50 border-white/40'
          } else cls += ' clay-card-interactive border-white/80'
          return (
            <button key={i} onClick={() => handleChoose(opt)} disabled={answered} className={cls} style={{ fontFamily: 'var(--font-display)' }}>
              <span className="text-2xl mr-1">{WORD_EMOJI[opt] || ''}</span> {opt}
            </button>
          )
        })}
      </div>
      <div className="text-clay-text-muted text-sm font-semibold">Word {index + 1} of {pool.length}</div>
    </div>
  )
}
