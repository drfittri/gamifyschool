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
  const [rightItems] = useState(() => shuffle(pool.map(w => ({ word: w }))))
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [selectedRight, setSelectedRight] = useState<number | null>(null)
  // Use separate Sets for left and right to avoid index collision
  const [matchedLeft, setMatchedLeft] = useState<Set<number>>(new Set())
  const [matchedRight, setMatchedRight] = useState<Set<number>>(new Set())
  const [wrongPair, setWrongPair] = useState<{ l: number; r: number } | null>(null)

  const handleLeft = (i: number) => {
    if (matchedLeft.has(i)) return
    playClick()
    if (selectedRight !== null) {
      const rightWord = rightItems[selectedRight].word
      if (leftItems[i].word === rightWord && !matchedRight.has(selectedRight)) {
        const ml = new Set(matchedLeft); ml.add(i)
        const mr = new Set(matchedRight); mr.add(selectedRight)
        setMatchedLeft(ml); setMatchedRight(mr)
        setSelectedLeft(null); setSelectedRight(null)
        playCorrect(); onCorrect()
        if (ml.size === pool.length) setTimeout(onComplete, 800)
      } else {
        setWrongPair({ l: i, r: selectedRight }); playWrong(); onWrong()
        setTimeout(() => setWrongPair(null), 500)
        setSelectedLeft(null); setSelectedRight(null)
      }
    } else { setSelectedLeft(i) }
  }

  const handleRight = (i: number) => {
    if (matchedRight.has(i)) return
    playClick()
    if (selectedLeft !== null) {
      const leftWord = leftItems[selectedLeft].word
      if (rightItems[i].word === leftWord && !matchedLeft.has(selectedLeft)) {
        const ml = new Set(matchedLeft); ml.add(selectedLeft)
        const mr = new Set(matchedRight); mr.add(i)
        setMatchedLeft(ml); setMatchedRight(mr)
        setSelectedLeft(null); setSelectedRight(null)
        playCorrect(); onCorrect()
        if (ml.size === pool.length) setTimeout(onComplete, 800)
      } else {
        setWrongPair({ l: selectedLeft, r: i }); playWrong(); onWrong()
        setTimeout(() => setWrongPair(null), 500)
        setSelectedLeft(null); setSelectedRight(null)
      }
    } else { setSelectedRight(i) }
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="clay-card px-5 py-3 text-center mb-1">
        <p className="text-lg font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          👈 Tap a picture-word, then tap its match! 👉
        </p>
      </div>
      <div className="flex gap-6 justify-center items-start flex-wrap max-w-2xl">
        <div className="flex flex-col gap-2.5">
          {leftItems.map((item, i) => (
            <button
              key={i}
              onClick={() => handleLeft(i)}
              disabled={matchedLeft.has(i)}
              className={`min-h-[52px] min-w-[140px] px-5 py-3 rounded-2xl text-xl font-extrabold transition-all duration-200 ${
                matchedLeft.has(i)
                  ? 'bg-clay-success/20 text-clay-success border-3 border-clay-success/30 cursor-default'
                  : selectedLeft === i
                    ? 'clay-card scale-105 border-3 border-clay-primary'
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
              disabled={matchedRight.has(i)}
              className={`min-h-[52px] min-w-[140px] px-5 py-3 rounded-2xl text-xl font-extrabold transition-all duration-200 ${
                matchedRight.has(i)
                  ? 'bg-clay-success/20 text-clay-success border-3 border-clay-success/30 cursor-default'
                  : selectedRight === i
                    ? 'clay-card scale-105 border-3 border-clay-pink'
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
      <p className="text-clay-text-muted text-sm font-semibold mt-1">{matchedLeft.size} of {pool.length} matched ✅</p>
    </div>
  )
}
