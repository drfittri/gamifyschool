import { useState, useEffect } from 'react'
import { playCorrect, playWrong } from '../hooks/useSound'
import { Lightbulb, Check, Delete } from 'lucide-react'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

function scramble(w: string): string {
  const arr = w.split('')
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]] }
  return arr.join('') === w ? `${arr[0]}${arr.slice(1).reverse().join('')}` : arr.join('')
}

const WORD_EMOJI: Record<string, string> = {
  hello: '👋', goodbye: '👋', friend: '👫', teacher: '👩‍🏫',
  head: '🗣️', eyes: '👀', nose: '👃', mouth: '👄', ears: '👂', hands: '🤲', feet: '🦶', hair: '💇',
  father: '👨', mother: '👩', brother: '👦', sister: '👧', baby: '👶', family: '👨‍👩‍👧‍👦', love: '❤️',
  red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', orange: '🟠', purple: '🟣', pink: '🩷', black: '⚫', white: '⚪', brown: '🟤',
  one: '1️⃣', two: '2️⃣', three: '3️⃣', four: '4️⃣', five: '5️⃣', six: '6️⃣', seven: '7️⃣', eight: '8️⃣', nine: '9️⃣', ten: '🔟',
  cat: '🐱', dog: '🐶', fish: '🐟', bird: '🐦', rabbit: '🐰', duck: '🦆', frog: '🐸', cow: '🐮', horse: '🐴', sheep: '🐑', elephant: '🐘', monkey: '🐵', snake: '🐍', tiger: '🐯',
  book: '📚', pen: '🖊️', pencil: '✏️', ruler: '📏', rubber: '🧹', bag: '🎒', desk: '🪑', notebook: '📓',
  rice: '🍚', bread: '🍞', cake: '🎂', egg: '🥚', milk: '🥛', water: '💧', juice: '🧃', apple: '🍎', banana: '🍌', pizza: '🍕', cheese: '🧀', sandwich: '🥪', sausages: '🌭',
  shirt: '👕', pants: '👖', dress: '👗', shoes: '👟', socks: '🧦', hat: '🎩',
  ball: '⚽', doll: '🪆', car: '🚗', bike: '🚲', kite: '🪁', teddy: '🧸', train: '🚂', plane: '✈️', monster: '👾',
}

export default function WordScrambleGame({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.filter(w => w.length >= 3).slice(0, 8)
  const [index, setIndex] = useState(0)
  const [scrambled, setScrambled] = useState('')
  const [playerInput, setPlayerInput] = useState('')
  const [wrong, setWrong] = useState(false)
  const [hint, setHint] = useState(false)
  const word = pool[index]
  const emoji = WORD_EMOJI[word] || '📝'

  useEffect(() => {
    setScrambled(scramble(word)); setPlayerInput(''); setWrong(false); setHint(false)
  }, [index, word])

  const handleKey = (letter: string) => { if (playerInput.length < word.length) setPlayerInput(playerInput + letter) }
  const handleDelete = () => setPlayerInput(playerInput.slice(0, -1))
  const handleHint = () => { setHint(true); setPlayerInput(word[0]) }

  const checkAnswer = () => {
    if (playerInput.toLowerCase() === word) { playCorrect(); onCorrect(); setTimeout(() => { if (index + 1 >= pool.length) onComplete(); else setIndex(index + 1) }, 600) }
    else { setWrong(true); playWrong(); onWrong(); setTimeout(() => setWrong(false), 600) }
  }

  const keyboard = 'abcdefghijklmnopqrstuvwxyz'.split('')

  return (
    <div className="flex flex-col items-center gap-4 max-w-lg mx-auto">
      <div className="clay-card px-5 py-2 text-center border-3 border-cyan-200 bg-cyan-50 w-full">
        <p className="text-base font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          🔐 Enemy spies scrambled our battle code! Decode the secret word!
        </p>
      </div>
      <div className="text-6xl animate-float">{emoji}</div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-bold text-cyan-600 tracking-widest uppercase">📡 Scrambled Code:</span>
        <div className="text-2xl font-extrabold text-clay-text bg-cyan-100 border-2 border-cyan-300 px-5 py-3 rounded-2xl tracking-[0.25em] select-none" style={{ fontFamily: 'var(--font-display)' }}>
          {scrambled.toUpperCase()}
        </div>
      </div>
      <div className="text-base text-clay-text-muted font-semibold">🕵️ Crack the code below!</div>
      <div className="flex gap-2 flex-wrap justify-center min-h-[50px]">
        {word.split('').map((_, i) => (
          <div key={i} className={`min-w-[48px] h-[48px] rounded-2xl flex items-center justify-center text-2xl font-extrabold transition-all duration-200 ${
            playerInput[i] ? (wrong ? 'bg-clay-error/20 text-clay-error animate-wiggle border-3 border-clay-error/30' : 'clay-card border-3 border-clay-success/30') : 'bg-white/60 border-3 border-dashed border-clay-primary-light/40'
          }`} style={{ fontFamily: 'var(--font-display)' }}>
            {playerInput[i]?.toUpperCase() || ''}
          </div>
        ))}
      </div>
      {playerInput.length > 0 && (
        <button onClick={handleDelete} className="flex items-center gap-1 clay-surface px-3 py-2 text-clay-error font-bold text-sm">
          <Delete className="w-4 h-4" /> Backspace
        </button>
      )}
      <div className="flex flex-wrap gap-1.5 justify-center max-w-[380px]">
        {keyboard.map(l => (
          <button key={l} onClick={() => handleKey(l)} disabled={playerInput.length >= word.length}
            className="clay-card-interactive min-w-[44px] h-[44px] rounded-xl flex items-center justify-center text-base font-extrabold text-clay-text border-2 border-white/80 disabled:opacity-30">
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex gap-3 mt-1">
        <button onClick={handleHint} disabled={hint} className="flex items-center gap-1.5 clay-surface px-4 py-2.5 text-clay-text-muted font-bold text-sm disabled:opacity-50">
          <Lightbulb className="w-4 h-4" /> 🧭 Clue
        </button>
        <button onClick={checkAnswer} disabled={playerInput.length < word.length} className={`flex items-center gap-1.5 clay-button px-5 py-2.5 text-lg ${playerInput.length < word.length ? 'opacity-50' : ''}`}>
          <Check className="w-5 h-5" /> 📡 Send Code!
        </button>
      </div>
    </div>
  )
}
