import { useState } from 'react'
import { playCorrect, playWrong, playClick } from '../hooks/useSound'

interface Props {
  words: string[]
  onCorrect: () => void
  onWrong: () => void
  onComplete: () => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

const WORD_EMOJI: Record<string, string> = {
  hello: '👋', goodbye: '👋', hi: '🖐️', bye: '👋', friend: '👫', teacher: '👩‍🏫', name: '📛', morning: '🌅', afternoon: '☀️',
  head: '🗣️', eyes: '👀', nose: '👃', mouth: '👄', ears: '👂', hands: '🤲', feet: '🦶', hair: '💇', arms: '💪', legs: '🦵',
  father: '👨', mother: '👩', brother: '👦', sister: '👧', baby: '👶', grandfather: '👴', grandmother: '👵', family: '👨‍👩‍👧‍👦', love: '❤️', home: '🏠',
  red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', orange: '🟠', purple: '🟣', pink: '🩷', black: '⚫', white: '⚪', brown: '🟤',
  one: '1️⃣', two: '2️⃣', three: '3️⃣', four: '4️⃣', five: '5️⃣', six: '6️⃣', seven: '7️⃣', eight: '8️⃣', nine: '9️⃣', ten: '🔟',
  cat: '🐱', dog: '🐶', fish: '🐟', bird: '🐦', rabbit: '🐰', duck: '🦆', frog: '🐸', cow: '🐮', horse: '🐴', sheep: '🐑', elephant: '🐘', monkey: '🐵', snake: '🐍', tiger: '🐯', spider: '🕷️', rat: '🐀', lizard: '🦎',
  book: '📚', pen: '🖊️', pencil: '✏️', ruler: '📏', rubber: '🧹', bag: '🎒', desk: '🪑', notebook: '📓',
  rice: '🍚', bread: '🍞', cake: '🎂', egg: '🥚', milk: '🥛', water: '💧', juice: '🧃', apple: '🍎', banana: '🍌', pizza: '🍕', cheese: '🧀', sandwich: '🥪', sausages: '🌭', peas: '🟢', carrots: '🥕',
  shirt: '👕', pants: '👖', dress: '👗', shoes: '👟', socks: '🧦', hat: '🎩',
  ball: '⚽', doll: '🪆', car: '🚗', bike: '🚲', kite: '🪁', teddy: '🧸', train: '🚂', plane: '✈️', monster: '👾',
  sing: '🎤', dance: '💃', read: '📖', write: '📝', draw: '🎨', swim: '🏊', run: '🏃', jump: '🦘', eat: '🍽️', drink: '🥤',
  big: '🐘', small: '🐜', long: '🐍', short: '📏', new: '✨', old: '📜', beautiful: '💐',
}

export default function WordMatchGame({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.slice(0, 8)
  const [leftItems] = useState(() => shuffle(pool.map(w => ({ word: w, emoji: WORD_EMOJI[w] || '📝' }))))
  const [rightItems] = useState(() => shuffle(pool.map(w => ({ word: w, emoji: '📝' }))))
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [selectedRight, setSelectedRight] = useState<number | null>(null)
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [wrongPair, setWrongPair] = useState<{ l: number; r: number } | null>(null)

  const handleLeft = (i: number) => {
    if (matched.has(i)) return
    playClick()
    if (selectedRight !== null) {
      const rightWord = rightItems[selectedRight].word
      if (leftItems[i].word === rightWord && !matched.has(selectedRight)) {
        const m = new Set(matched); m.add(i); m.add(selectedRight)
        setMatched(m); setSelectedLeft(null); setSelectedRight(null)
        playCorrect(); onCorrect()
        if (m.size === pool.length * 2) setTimeout(onComplete, 800)
      } else {
        setWrongPair({ l: i, r: selectedRight }); playWrong(); onWrong()
        setTimeout(() => setWrongPair(null), 500)
        setSelectedLeft(null); setSelectedRight(null)
      }
    } else { setSelectedLeft(i) }
  }

  const handleRight = (i: number) => {
    if (matched.has(i)) return
    playClick()
    if (selectedLeft !== null) {
      const leftWord = leftItems[selectedLeft].word
      if (rightItems[i].word === leftWord && !matched.has(selectedLeft)) {
        const m = new Set(matched); m.add(selectedLeft); m.add(i)
        setMatched(m); setSelectedLeft(null); setSelectedRight(null)
        playCorrect(); onCorrect()
        if (m.size === pool.length * 2) setTimeout(onComplete, 800)
      } else {
        setWrongPair({ l: selectedLeft, r: i }); playWrong(); onWrong()
        setTimeout(() => setWrongPair(null), 500)
        setSelectedLeft(null); setSelectedRight(null)
      }
    } else { setSelectedRight(i) }
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <p className="text-lg font-extrabold text-clay-text-muted text-center" style={{ fontFamily: 'var(--font-display)' }}>Tap a word on the left, then tap the matching word on the right!</p>
      <div className="flex gap-6 justify-center items-start flex-wrap max-w-2xl">
        <div className="flex flex-col gap-2.5">
        {leftItems.map((item, i) => (
          <button
            key={i}
            onClick={() => handleLeft(i)}
            disabled={matched.has(i)}
            className={`min-h-[52px] min-w-[140px] px-5 py-3 rounded-2xl text-xl font-extrabold transition-all duration-200 ${
              matched.has(i)
                ? 'bg-clay-success/20 text-clay-success border-3 border-clay-success/30 cursor-default'
                : selectedLeft === i
                  ? 'clay-card scale-105 border-clay-primary'
                  : wrongPair?.l === i
                    ? 'bg-clay-error/20 text-clay-error animate-wiggle border-3 border-clay-error/30'
                    : 'clay-card-interactive border-3 border-white/80'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="text-2xl mr-2">{item.emoji}</span>
            {item.word}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {rightItems.map((item, i) => (
          <button
            key={i}
            onClick={() => handleRight(i)}
            disabled={matched.has(i)}
            className={`min-h-[52px] min-w-[140px] px-5 py-3 rounded-2xl text-xl font-extrabold transition-all duration-200 ${
              matched.has(i)
                ? 'bg-clay-success/20 text-clay-success border-3 border-clay-success/30 cursor-default'
                : selectedRight === i
                  ? 'clay-card scale-105 border-clay-pink'
                  : wrongPair?.r === i
                    ? 'bg-clay-error/20 text-clay-error animate-wiggle border-3 border-clay-error/30'
                    : 'clay-card-interactive border-3 border-white/80'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {item.word}
          </button>
        ))}
      </div>
      </div>
    </div>
  )
}
