import { useState, useEffect, useRef } from 'react'
import { playCorrect, playWrong, playCountdown } from '../hooks/useSound'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

const WORD_EMOJI: Record<string, string> = {
  hello: '👋', goodbye: '👋', hi: '🖐️', friend: '👫', teacher: '👩‍🏫',
  head: '🗣️', eyes: '👀', nose: '👃', mouth: '👄', ears: '👂', hands: '🤲', feet: '🦶',
  father: '👨', mother: '👩', brother: '👦', sister: '👧', baby: '👶', family: '👨‍👩‍👧‍👦', love: '❤️', home: '🏠',
  red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', orange: '🟠', purple: '🟣', pink: '🩷', black: '⚫', white: '⚪', brown: '🟤',
  one: '1️⃣', two: '2️⃣', three: '3️⃣', four: '4️⃣', five: '5️⃣', six: '6️⃣', seven: '7️⃣', eight: '8️⃣', nine: '9️⃣', ten: '🔟',
  cat: '🐱', dog: '🐶', fish: '🐟', bird: '🐦', rabbit: '🐰', duck: '🦆', frog: '🐸', cow: '🐮', horse: '🐴', sheep: '🐑', elephant: '🐘', monkey: '🐵', snake: '🐍', tiger: '🐯',
  book: '📚', pen: '🖊️', pencil: '✏️', ruler: '📏', rubber: '🧹', bag: '🎒', desk: '🪑', notebook: '📓',
  rice: '🍚', bread: '🍞', cake: '🎂', egg: '🥚', milk: '🥛', water: '💧', juice: '🧃', apple: '🍎', banana: '🍌', pizza: '🍕', cheese: '🧀', sandwich: '🥪', sausages: '🌭',
  shirt: '👕', pants: '👖', dress: '👗', shoes: '👟', socks: '🧦', hat: '🎩',
  ball: '⚽', doll: '🪆', car: '🚗', bike: '🚲', kite: '🪁', teddy: '🧸', train: '🚂', plane: '✈️', monster: '👾',
  sing: '🎤', dance: '💃', read: '📖', write: '📝', draw: '🎨', swim: '🏊', run: '🏃', jump: '🦘',
}

export default function SpeedTypingGame({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.slice(0, 12)
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [gameOver, setGameOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const word = pool[index % pool.length]
  const emoji = WORD_EMOJI[word] || '📝'

  useEffect(() => { inputRef.current?.focus() }, [index])
  useEffect(() => {
    if (gameOver) return
    if (timeLeft <= 0) { setGameOver(true); playWrong(); onComplete(); return }
    const timer = setInterval(() => { setTimeLeft(t => t - 1); if (timeLeft <= 10) playCountdown() }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, gameOver])

  const handleSubmit = () => {
    if (input.trim().toLowerCase() === word) {
      playCorrect(); onCorrect(); setScore(s => s + 1); setInput('')
      setIndex(i => (i + 1) % pool.length); setTimeLeft(t => Math.min(t + 3, 60))
    } else { setWrong(true); playWrong(); onWrong(); setTimeLeft(t => Math.max(t - 3, 1)); setTimeout(() => setWrong(false), 500) }
  }

  return (
    <div className="flex flex-col items-center gap-5 max-w-md mx-auto">
      <div className="clay-card px-5 py-2 text-center border-3 border-orange-200 bg-orange-50 w-full">
        <div className="text-2xl mb-0.5">🏎️⚡🏁</div>
        <p className="text-base font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          Type the word fast to keep your race car fuelled! Every correct word = more speed!
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-2xl">⛽</span>
        <div className="flex items-center gap-2 text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          <span className={timeLeft <= 10 ? 'text-clay-error animate-pulse-soft' : 'text-clay-text'}>{timeLeft}s</span>
          <span className="text-lg text-clay-text-muted font-bold">fuel</span>
        </div>
      </div>
      <div className="text-6xl animate-float">{emoji}</div>
      <div className="text-3xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>{word}</div>
      <div className="text-base text-clay-text-muted font-semibold">⌨️ Type the word to fuel your car!</div>
      <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }} disabled={gameOver}
        className={`min-h-[56px] w-full max-w-[260px] px-5 py-3 rounded-2xl text-2xl font-extrabold text-center outline-none transition-all border-3 bg-white/90 ${
          wrong ? 'border-clay-error animate-wiggle' : 'border-clay-primary-light/40 focus:border-clay-primary'
        }`} style={{ fontFamily: 'var(--font-display)' }} placeholder="Type here..." autoFocus />
      <button onClick={handleSubmit} disabled={gameOver || !input} className="clay-button px-6 py-3 text-lg disabled:opacity-50">Submit</button>
      <div className="text-xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>🏎️ Words typed: {score}</div>
      {gameOver && (
        <div className="clay-card p-6 text-center animate-pop-in space-y-2">
          <div className="text-5xl animate-sway">{score >= 10 ? '🏆' : score >= 5 ? '🥈' : '🏎️'}</div>
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>🏁 Race Finished!</p>
          <p className="text-lg text-clay-text-muted font-bold">You fuelled your car <span className="text-clay-primary">{score} times!</span></p>
          <p className="text-base font-bold text-clay-text-muted">{score >= 10 ? '🏆 Champion driver!' : score >= 5 ? '🥈 Great lap!' : '💪 Keep practising!'}</p>
        </div>
      )}
    </div>
  )
}
