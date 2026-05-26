import { useState, useEffect } from 'react'
import { playCorrect, playWrong, playClick } from '../hooks/useSound'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }
interface Card { id: number; content: string; type: 'word' | 'emoji'; word: string; flipped: boolean; matched: boolean }

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }

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
  sing: '🎤', dance: '💃', read: '📖', write: '📝', draw: '🎨', swim: '🏊', run: '🏃',
}

export default function MemoryCardGame({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.slice(0, 6)
  const [cards, setCards] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [matchedCount, setMatchedCount] = useState(0)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const cardList: Card[] = pool.flatMap((w, i) => [
      { id: i * 2, content: w, type: 'word', word: w, flipped: false, matched: false },
      { id: i * 2 + 1, content: WORD_EMOJI[w] || '📝', type: 'emoji', word: w, flipped: false, matched: false },
    ])
    setCards(shuffle(cardList)); setMatchedCount(0)
  }, [words.join(',')])

  const handleFlip = (id: number) => {
    const card = cards.find(c => c.id === id)
    if (!card || card.flipped || card.matched || locked || flipped.length >= 2) return
    playClick()
    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c)
    setCards(newCards)
    const newFlipped = [...flipped, id]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setLocked(true)
      const [a, b] = newFlipped.map(fid => newCards.find(c => c.id === fid)!)
      if (a.word === b.word && a.type !== b.type) {
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === a.id || c.id === b.id) ? { ...c, matched: true } : c))
          const newMatched = matchedCount + 1; setMatchedCount(newMatched); setFlipped([]); setLocked(false)
          playCorrect(); onCorrect()
          if (newMatched >= pool.length) setTimeout(onComplete, 600)
        }, 400)
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === a.id || c.id === b.id) ? { ...c, flipped: false } : c))
          setFlipped([]); setLocked(false); playWrong(); onWrong()
        }, 800)
      }
    }
  }

  const cols = pool.length <= 4 ? 4 : 4

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-lg font-extrabold text-clay-text-muted text-center" style={{ fontFamily: 'var(--font-display)' }}>Flip two cards to find matching pairs!</p>
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(80px, 100px))` }}>
      {cards.map(card => (
        <button key={card.id} onClick={() => handleFlip(card.id)}
          className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 font-extrabold border-3 ${
            card.matched
              ? 'bg-clay-success/15 border-clay-success/20 cursor-default'
              : card.flipped
                ? `clay-card border-clay-primary/30 text-2xl ${card.type === 'word' ? 'text-clay-text' : ''}`
                : 'clay-card-interactive border-white/80'
          }`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {card.flipped || card.matched ? (
            card.type === 'word' ? <span className="text-sm">{card.content}</span> : <span className="text-3xl">{card.content}</span>
          ) : (
            <span className="text-clay-primary-light/50 text-2xl">?</span>
          )}
        </button>
      ))}
      </div>
    </div>
  )
}
