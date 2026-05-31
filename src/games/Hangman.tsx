import { useState, useEffect } from 'react'
import { playCorrect, playWrong } from '../hooks/useSound'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

const WORD_EMOJI: Record<string, string> = {
  hello: '👋', goodbye: '👋', hi: '🖐️', friend: '👫', teacher: '👩‍🏫', name: '📛',
  head: '🗣️', eyes: '👀', nose: '👃', mouth: '👄', ears: '👂', hands: '🤲', feet: '🦶',
  father: '👨', mother: '👩', brother: '👦', sister: '👧', baby: '👶', family: '👨‍👩‍👧‍👦', love: '❤️', home: '🏠',
  red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', orange: '🟠', purple: '🟣', pink: '🩷', black: '⚫', white: '⚪', brown: '🟤',
  one: '1️⃣', two: '2️⃣', three: '3️⃣', four: '4️⃣', five: '5️⃣', six: '6️⃣', seven: '7️⃣', eight: '8️⃣', nine: '9️⃣', ten: '🔟',
  cat: '🐱', dog: '🐶', fish: '🐟', bird: '🐦', rabbit: '🐰', duck: '🦆', frog: '🐸', cow: '🐮', horse: '🐴', sheep: '🐑', elephant: '🐘', monkey: '🐵', snake: '🐍', tiger: '🐯', spider: '🕷️', rat: '🐀', lizard: '🦎',
  book: '📚', pen: '🖊️', pencil: '✏️', ruler: '📏', rubber: '🧹', bag: '🎒', desk: '🪑', notebook: '📓',
  rice: '🍚', bread: '🍞', cake: '🎂', egg: '🥚', milk: '🥛', water: '💧', juice: '🧃', apple: '🍎', banana: '🍌', pizza: '🍕', cheese: '🧀', sandwich: '🥪', sausages: '🌭',
  shirt: '👕', pants: '👖', dress: '👗', shoes: '👟', socks: '🧦', hat: '🎩',
  ball: '⚽', doll: '🪆', car: '🚗', bike: '🚲', kite: '🪁', teddy: '🧸', train: '🚂', plane: '✈️', monster: '👾',
  sing: '🎤', dance: '💃', read: '📖', write: '📝', draw: '🎨', swim: '🏊', run: '🏃', jump: '🦘',
}

export default function HangmanGame({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.filter(w => w.length >= 3).slice(0, 8)
  const [index, setIndex] = useState(0)
  const [guessed, setGuessed] = useState<Set<string>>(new Set())
  const [wrongs, setWrongs] = useState(0)
  const [ended, setEnded] = useState(false)
  const maxWrongs = 6
  const word = pool[index]
  const emoji = WORD_EMOJI[word] || '📝'
  const wordSet = new Set(word.split(''))
  const isWon = [...wordSet].filter(l => guessed.has(l)).length >= wordSet.size
  const isLost = wrongs >= maxWrongs

  useEffect(() => { setGuessed(new Set()); setWrongs(0); setEnded(false) }, [index])

  useEffect(() => {
    if (isWon && !ended) { setEnded(true); playCorrect(); onCorrect(); setTimeout(() => { if (index + 1 >= pool.length) onComplete(); else setIndex(index + 1) }, 1500) }
    else if (isLost && !ended) { setEnded(true); playWrong(); onWrong(); setTimeout(() => { if (index + 1 >= pool.length) onComplete(); else setIndex(index + 1) }, 2000) }
  }, [isWon, isLost])

  const guess = (letter: string) => {
    if (ended || guessed.has(letter)) return
    const g = new Set(guessed); g.add(letter); setGuessed(g)
    if (!word.includes(letter)) setWrongs(w => w + 1)
    else playCorrect()
  }

  const keys = 'abcdefghijklmnopqrstuvwxyz'.split('')

  const dragonStage = ["🥚", "🐣", "🐲", "🐲💨", "🔥🐲", "💀🔥"][Math.min(wrongs, 5)]
  const dragonMsg = ["Dragon egg is sleeping...", "Dragon is waking up!", "Dragon is getting angry!", "Dragon is breathing smoke!", "Dragon is about to fire!", "The dragon won! 🔥"][Math.min(wrongs, 5)]

  return (
    <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
      <div className="clay-card px-5 py-2 text-center border-3 border-rose-200 bg-rose-50 w-full">
        <p className="text-base font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          🐲 A dragon has trapped a word! Guess the letters to break the spell before the dragon strikes!
        </p>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="text-5xl animate-sway">{dragonStage}</div>
        <div className="text-xs text-clay-error font-extrabold">{dragonMsg}</div>
      </div>
      <div className="flex items-center gap-2 text-sm font-bold text-clay-text-muted">
        <span>Dragon power:</span>
        <div className="flex gap-1">
          {[...Array(maxWrongs)].map((_, i) => (
            <span key={i} className="text-base">{i < wrongs ? '🔥' : '💧'}</span>
          ))}
        </div>
      </div>
      <div className="text-6xl animate-float">{emoji}</div>
      <div className="flex gap-2 flex-wrap justify-center">
        {word.split('').map((l, i) => (
          <div key={i} className={`min-w-[44px] h-[44px] rounded-xl flex items-center justify-center text-xl font-extrabold transition-all duration-200 ${
            guessed.has(l) || isLost
              ? guessed.has(l) ? 'clay-card border-3 border-clay-success/30 animate-pop-in' : 'bg-clay-error/20 text-clay-error border-3 border-clay-error/30'
              : 'bg-white/60 border-3 border-dashed border-clay-primary-light/40'
          }`} style={{ fontFamily: 'var(--font-display)' }}>
            {(guessed.has(l) || isLost) ? l.toUpperCase() : ''}
          </div>
        ))}
      </div>
      {isLost && <div className="text-clay-error font-extrabold text-lg animate-wiggle">🔥 Dragon wins! The word was: <span className="text-clay-text">{word}</span></div>}
      {isWon && <div className="text-clay-success font-extrabold text-lg animate-bounce-in">🛡️ Dragon defeated! Well done!</div>}
      <div className="flex flex-wrap gap-1 justify-center max-w-[360px]">
        {keys.map(l => {
          const used = guessed.has(l); const correct = word.includes(l) && guessed.has(l); const wrong = guessed.has(l) && !word.includes(l)
          return (
            <button key={l} onClick={() => guess(l)} disabled={ended || used}
              className={`min-w-[44px] h-[44px] rounded-lg text-base font-extrabold transition-all border-2 ${
                correct ? 'bg-clay-success/20 text-clay-success border-clay-success/30' : wrong ? 'bg-clay-error/15 text-clay-error border-clay-error/20' : used ? 'bg-gray-200 border-gray-200' : 'clay-card-interactive border-white/80'
              }`} style={{ fontFamily: 'var(--font-display)' }}>
              {l.toUpperCase()}
            </button>
          )
        })}
      </div>
      <div className="text-clay-text-muted text-sm font-semibold">🐲 Dragon {index + 1} of {pool.length}</div>
    </div>
  )
}
