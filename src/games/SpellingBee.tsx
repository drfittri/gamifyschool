import { useState, useEffect } from 'react'
import { playCorrect, playWrong } from '../hooks/useSound'
import { Lightbulb, Check } from 'lucide-react'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

const WORD_EMOJI: Record<string, string> = {
  hello: '👋', goodbye: '👋', hi: '🖐️', friend: '👫', teacher: '👩‍🏫', name: '📛',
  head: '🗣️', eyes: '👀', nose: '👃', mouth: '👄', ears: '👂', hands: '🤲', feet: '🦶', hair: '💇',
  father: '👨', mother: '👩', brother: '👦', sister: '👧', baby: '👶', family: '👨‍👩‍👧‍👦', love: '❤️', home: '🏠',
  red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', orange: '🟠', purple: '🟣', pink: '🩷', black: '⚫', white: '⚪', brown: '🟤',
  one: '1️⃣', two: '2️⃣', three: '3️⃣', four: '4️⃣', five: '5️⃣', six: '6️⃣', seven: '7️⃣', eight: '8️⃣', nine: '9️⃣', ten: '🔟',
  cat: '🐱', dog: '🐶', fish: '🐟', bird: '🐦', rabbit: '🐰', duck: '🦆', frog: '🐸', cow: '🐮', horse: '🐴', sheep: '🐑', elephant: '🐘', monkey: '🐵', snake: '🐍', tiger: '🐯',
  book: '📚', pen: '🖊️', pencil: '✏️', ruler: '📏', rubber: '🧹', bag: '🎒', desk: '🪑', notebook: '📓',
  rice: '🍚', bread: '🍞', cake: '🎂', egg: '🥚', milk: '🥛', water: '💧', juice: '🧃', apple: '🍎', banana: '🍌', pizza: '🍕', cheese: '🧀', sandwich: '🥪', sausages: '🌭',
  shirt: '👕', pants: '👖', dress: '👗', shoes: '👟', socks: '🧦', hat: '🎩',
  ball: '⚽', doll: '🪆', car: '🚗', bike: '🚲', kite: '🪁', teddy: '🧸', train: '🚂', plane: '✈️', monster: '👾',
  sing: '🎤', dance: '💃', read: '📖', write: '📝', draw: '🎨', swim: '🏊', run: '🏃', jump: '🦘', eat: '🍽️', drink: '🥤',
  big: '🐘', small: '🐜', long: '🐍', short: '📏', new: '✨', old: '📜', beautiful: '💐',
}

export default function SpellingBeeGame({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.slice(0, 8)
  const [index, setIndex] = useState(0)
  const [letters, setLetters] = useState<string[]>([])
  const [shuffled, setShuffled] = useState<string[]>([])
  const [answer, setAnswer] = useState<string[]>([])
  const [wrong, setWrong] = useState(false)
  const [hint, setHint] = useState(false)
  const word = pool[index]
  const emoji = WORD_EMOJI[word] || '📝'

  useEffect(() => {
    const l = word.split('')
    setLetters(l)
    // Add 2 distractor letters (not already in the word) so tiles aren't just the answer
    const used = new Set(l)
    const extras: string[] = []
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('')
    let guard = 0
    while (extras.length < 2 && guard < 100) {
      const cand = alphabet[Math.floor(Math.random() * 26)]
      if (!used.has(cand)) { extras.push(cand); used.add(cand) }
      guard++
    }
    // Fisher-Yates shuffle of word letters + distractors
    const a = [...l, ...extras]
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    setShuffled(a)
    setAnswer([]); setWrong(false); setHint(false)
  }, [index, word])

  const pickLetter = (letter: string, idx: number) => {
    if (answer.length >= letters.length) return
    setAnswer([...answer, letter])
    setShuffled(prev => { const n = [...prev]; n.splice(idx, 1); return n })
  }

  const removeLetter = (idx: number) => {
    const letter = answer[idx]
    setAnswer(answer.filter((_, i) => i !== idx))
    setShuffled([...shuffled, letter])
  }

  const checkAnswer = () => {
    const ans = answer.join('')
    if (ans === word) { playCorrect(); onCorrect(); setTimeout(() => { if (index + 1 >= pool.length) onComplete(); else setIndex(index + 1) }, 600) }
    else { setWrong(true); playWrong(); onWrong(); setTimeout(() => setWrong(false), 600) }
  }

  return (
    <div className="flex flex-col items-center gap-4 max-w-lg mx-auto">
      <div className="clay-card px-5 py-2 text-center border-3 border-amber-200 bg-amber-50 w-full">
        <p className="text-base font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          📜 Cast the magic spell! Tap the enchanted letters in order!
        </p>
      </div>
      <div className="text-6xl animate-float">{emoji}</div>
      <div className="text-2xl font-extrabold text-clay-text text-center" style={{ fontFamily: 'var(--font-display)' }}>
        ✨ Spell the magic word!
        {hint && <span className="ml-2 text-base bg-clay-surface px-3 py-1 rounded-full text-clay-text-muted">{word[0]}...{word[word.length - 1]}</span>}
      </div>
      <div className="flex gap-2.5 flex-wrap justify-center min-h-[58px]">
        {letters.map((_, i) => (
          <button
            key={i}
            onClick={() => answer[i] && removeLetter(i)}
            className={`min-w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-2xl font-extrabold transition-all duration-200 ${
              answer[i]
                ? wrong ? 'bg-clay-error/20 text-clay-error animate-wiggle border-3 border-clay-error/30' : 'clay-card border-3 border-clay-success/30'
                : 'bg-white/60 border-3 border-dashed border-clay-primary-light/40'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {answer[i]?.toUpperCase() || ''}
          </button>
        ))}
      </div>
      <div className="flex gap-2.5 flex-wrap justify-center">
        {shuffled.map((letter, i) => (
          <button
            key={`l-${i}`}
            onClick={() => pickLetter(letter, i)}
            className="clay-card-interactive min-w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-2xl font-extrabold text-clay-text border-3 border-white/80"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {letter.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex gap-3 mt-1">
        <button onClick={() => setHint(true)} disabled={hint} className="flex items-center gap-1.5 clay-surface px-4 py-2.5 text-clay-text-muted font-bold text-sm disabled:opacity-50">
          <Lightbulb className="w-4 h-4" /> 🔮 Magic Hint
        </button>
        <button onClick={checkAnswer} disabled={answer.length < letters.length} className={`flex items-center gap-1.5 clay-button px-5 py-2.5 text-lg ${answer.length < letters.length ? 'opacity-50' : ''}`}>
          <Check className="w-5 h-5" /> ✨ Cast Spell!
        </button>
      </div>
      <div className="text-clay-text-muted text-sm font-semibold">📜 Scroll {index + 1} of {pool.length}</div>
    </div>
  )
}
