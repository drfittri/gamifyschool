import { useState, useMemo } from 'react'
import { lessons } from '../data/lessons'
import { playCorrect, playWrong } from '../hooks/useSound'
import { Sword } from 'lucide-react'

interface Props {
  words: string[]
  onCorrect: () => void
  onWrong: () => void
  onComplete: () => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Category {
  name: string
  emoji: string
  words: string[]
}

function buildCategories(): Category[] {
  const all: Record<string, string[]> = {}
  for (const l of lessons) {
    const cat = l.title
    if (!all[cat]) all[cat] = []
    for (const w of l.words) {
      if (!all[cat].includes(w)) all[cat].push(w)
    }
  }
  const titles: Record<string, string> = {
    'My Body': 'Body Parts',
    'Colours': 'Colours',
    'Animals': 'Animals',
    'My Classroom': 'School',
    'Food & Drinks': 'Food & Drinks',
    'Clothes': 'Clothes',
    'Toys & Play': 'Toys',
    'My Family': 'Family',
  }
  const emojis: Record<string, string> = {
    'My Body': '\u{1F9CD}',
    'Colours': '\u{1F3A8}',
    'Animals': '\u{1F43E}',
    'My Classroom': '\u{1F3EB}',
    'Food & Drinks': '\u{1F354}',
    'Clothes': '\u{1F455}',
    'Toys & Play': '\u{1F3B2}',
    'My Family': '\u{1F46A}',
  }
  const cats: Category[] = []
  for (const [key, ws] of Object.entries(all)) {
    if (titles[key] && ws.length >= 5) {
      cats.push({ name: titles[key], emoji: emojis[key] || '\u{1F4E6}', words: ws })
    }
  }
  return cats
}

export default function CategorySort({ words: _words, onCorrect, onWrong, onComplete }: Props) {
  const items = useMemo(() => {
    const cats = buildCategories()
    const chosen = shuffle(cats).slice(0, 3)
    const pool: { word: string; category: string; emoji: string }[] = []
    for (const c of chosen) {
      const picks = shuffle([...c.words]).slice(0, 4)
      for (const w of picks) {
        pool.push({ word: w, category: c.name, emoji: c.emoji })
      }
    }
    return shuffle(pool).slice(0, 10)
  }, [])

  const categories = useMemo(() => {
    const seen = new Set<string>()
    const cats: { name: string; emoji: string }[] = []
    for (const it of items) {
      if (!seen.has(it.category)) {
        seen.add(it.category)
        cats.push({ name: it.category, emoji: it.emoji })
      }
    }
    return cats
  }, [items])

  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [soldiers, setSoldiers] = useState(0)

  if (items.length === 0) {
    return <div className="text-clay-text font-bold text-center p-8">Need more lesson data!</div>
  }

  const item = items[index]

  const handleSort = (cat: string) => {
    if (answered) return
    setChosen(cat)
    setAnswered(true)
    if (cat === item.category) {
      playCorrect()
      onCorrect()
      setSoldiers(s => Math.min(s + 1, 10))
    } else {
      playWrong()
      onWrong()
    }
    setTimeout(() => {
      if (index + 1 >= items.length) onComplete()
      else { setIndex(i => i + 1); setChosen(null); setAnswered(false) }
    }, 900)
  }

  return (
    <div className="flex flex-col items-center gap-4 max-w-lg mx-auto w-full">
      <div className="clay-card px-5 py-2 text-center border-3 border-emerald-200 bg-emerald-50 w-full">
        <div className="text-2xl mb-0.5">🪖🏕️⚔️</div>
        <p className="text-base font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          Recruits are arriving! Sort each word-soldier into the correct battalion barracks!
        </p>
      </div>
      <div className="flex items-center gap-2 text-lg font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
        <Sword className="w-6 h-6 text-clay-cta" strokeWidth={2.5} />
        Recruit {index + 1}/{items.length}
      </div>

      <div className="clay-card p-5 w-full text-center space-y-4">
        <p className="text-clay-text-muted text-sm font-semibold">Which battalion does this recruit belong to?</p>
        <p className="text-3xl font-extrabold text-clay-text animate-float" style={{ fontFamily: 'var(--font-display)' }}>
          {item.word}
        </p>
      </div>

      <div className="flex gap-3 flex-wrap justify-center w-full">
        {categories.map((cat, i) => {
          const isRight = cat.name === item.category
          let cls = 'clay-card-interactive flex-1 min-w-[110px] min-h-[72px] p-3 rounded-2xl text-center flex flex-col items-center justify-center gap-1 border-3 transition-all duration-200'
          if (answered) {
            if (isRight) cls += ' border-clay-success/40 animate-pop-in bg-clay-success/10'
            else if (chosen === cat.name) cls += ' border-clay-error/40 animate-wiggle bg-clay-error/10'
            else cls += ' opacity-40 border-white/20'
          } else {
            cls += ' border-white/80'
          }
          return (
            <button key={i} onClick={() => handleSort(cat.name)} disabled={answered} className={cls}>
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-sm font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>{cat.name}</span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-1 items-center bg-clay-surface rounded-2xl px-4 py-2">
        <Sword className="w-5 h-5 text-clay-cta" strokeWidth={2.5} />
        <span className="text-clay-text font-extrabold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
          {soldiers}/10 soldiers deployed!
        </span>
        <span className="flex gap-0.5">
          {[...Array(soldiers)].map((_, i) => (
            <span key={i} className="text-sm">&#x1F96A;</span>
          ))}
        </span>
      </div>
    </div>
  )
}
