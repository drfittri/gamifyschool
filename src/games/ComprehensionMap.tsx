import { useState, useMemo } from 'react'
import type { LessonTopic } from '../utils/types'
import { playCorrect, playWrong } from '../hooks/useSound'
import { Compass } from 'lucide-react'

interface Props {
  words: string[]
  unit: LessonTopic
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

interface CompQ {
  passage: string
  question: string
  answer: string
  options: string[]
}

const PEOPLE = ['Ali', 'Siti', 'Minah', 'Ahmad', 'Rajoo', 'Mei Ling', 'Adam', 'Hana']
const Colours = ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'black', 'white']
// Non-noun lesson words that read wrong in "has a ___" / "has 4 ___s" passages.
const NOT_A_NOUN = new Set([
  'hello', 'goodbye', 'hi', 'bye', 'good', 'morning', 'afternoon', 'wear', 'eat', 'drink', 'play', 'share',
  'read', 'sing', 'dance', 'swim', 'run', 'jump', 'draw', 'skip', 'crawl', 'touch', 'count',
  'hot', 'cold', 'happy', 'fast', 'pretty', 'soft', 'sweet', 'love',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'weekend',
])

function article(w: string): string { return /^[aeiou]/i.test(w) ? 'an' : 'a' }
function pluralize(w: string): string {
  const irregular: Record<string, string> = { fish: 'fish', sheep: 'sheep', foot: 'feet', tooth: 'teeth', child: 'children' }
  if (irregular[w]) return irregular[w]
  if (/[sxz]$/.test(w) || /(ch|sh)$/.test(w) || /o$/.test(w)) return w + 'es'
  if (/[bcdfghjklmnpqrstvwxyz]y$/.test(w)) return w.slice(0, -1) + 'ies'
  return w + 's'
}

export default function ComprehensionMap({ words: _words, unit, onCorrect, onWrong, onComplete }: Props) {
  const questions = useMemo(() => {
    const qs: CompQ[] = []
    // prefer concrete nouns; only fall back to all words if there aren't enough to fill options
    let unitWords = unit.words.filter(w => w.length >= 3 && !w.includes(' ') && !NOT_A_NOUN.has(w.toLowerCase()))
    if (unitWords.length < 2) unitWords = unit.words.filter(w => w.length >= 3 && !w.includes(' '))

    for (let i = 0; i < 5 && unitWords.length > 0; i++) {
      const person = PEOPLE[i % PEOPLE.length]
      const w1 = unitWords[i * 2 % unitWords.length]
      const w2 = unitWords[(i * 2 + 1) % unitWords.length]
      const color = shuffle(Colours)[0]
      const number = Math.floor(Math.random() * 5) + 2

      const passages = [
        { passage: `${person} has ${article(w1)} ${w1}. It is ${color}. ${person} likes it very much.`, question: `What colour is the ${w1}?`, answer: color },
        { passage: `${person} has ${number} ${pluralize(w1)}. One is ${color}. The others are white.`, question: `How many ${pluralize(w1)} does ${person} have?`, answer: String(number) },
        { passage: `${person} likes to eat ${w1}. ${person} does not like ${w2}.`, question: `What does ${person} like to eat?`, answer: w1 },
        { passage: `${person} can see ${article(w1)} ${w1} and ${article(w2)} ${w2}. The ${w1} is ${color}.`, question: `What can ${person} see?`, answer: w1 },
        { passage: `${person} plays with ${article(w1)} ${w1} every day. The ${w1} is ${color}.`, question: `What does ${person} play with?`, answer: w1 },
      ]

      const picked = passages[i % passages.length]
      const isNumeric = /^\d+$/.test(picked.answer)
      if (isNumeric) {
        // numeric answer needs numeric distractors, else the only digit is a giveaway
        const opts = new Set<string>([picked.answer])
        while (opts.size < 4) {
          const n = Math.floor(Math.random() * 8) + 2
          opts.add(String(n))
        }
        qs.push({ ...picked, options: shuffle([...opts]) })
      } else {
        const distractorWords = shuffle(unitWords.filter(w => w !== picked.answer && String(w) !== picked.answer)).slice(0, 3)
        if (distractorWords.length >= 3) {
          qs.push({ ...picked, options: shuffle([picked.answer, ...distractorWords]) })
        }
      }
    }

    if (qs.length < 4) {
      for (let i = 0; i < 5 && qs.length < 6; i++) {
        const person = PEOPLE[(i + 10) % PEOPLE.length]
        const w = shuffle([...unitWords])[0] || 'thing'
        qs.push({
          passage: `${person} likes the ${w}. The ${w} is good. ${person} is happy.`,
          question: `What does ${person} like?`,
          answer: w,
          options: shuffle([w, ...shuffle(unitWords.filter(x => x !== w)).slice(0, 3)]),
        })
      }
    }

    return shuffle(qs).slice(0, 5)
  }, [unit])

  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [steps, setSteps] = useState(0)
  const maxSteps = questions.length

  if (questions.length === 0) {
    return <div className="text-clay-text font-bold text-center p-8">Need more words for this unit!</div>
  }

  const q = questions[index]

  const handleAnswer = (opt: string) => {
    if (answered) return
    setChosen(opt)
    setAnswered(true)
    if (opt === q.answer) {
      playCorrect()
      onCorrect()
      setSteps(s => Math.min(s + 1, maxSteps))
    } else {
      playWrong()
      onWrong()
    }
    setTimeout(() => {
      if (index + 1 >= questions.length) onComplete()
      else { setIndex(i => i + 1); setChosen(null); setAnswered(false) }
    }, 1200)
  }

  const GRID = 5

  return (
    <div className="flex flex-col items-center gap-4 max-w-lg mx-auto w-full">
      <div className="clay-card px-5 py-2 text-center border-3 border-amber-200 bg-amber-50 w-full">
        <div className="text-2xl mb-0.5">🗺️📖⚔️</div>
        <p className="text-base font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          Read the adventurer's quest journal! Answer correctly to take a step toward the treasure!
        </p>
      </div>
      <div className="flex items-center gap-2 text-lg font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
        <Compass className="w-6 h-6 text-clay-cta" strokeWidth={2.5} />
        Quest entry {index + 1}/{questions.length}
      </div>

      <div className="clay-card p-5 w-full space-y-3">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-base leading-relaxed text-clay-text font-semibold">
          <span className="text-xs font-extrabold text-amber-600 uppercase tracking-wider block mb-2">📖 Quest Journal</span>
          {q.passage}
        </div>
        <p className="text-lg font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          {q.question}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt, i) => {
            let cls = 'min-h-[52px] px-3 py-3 rounded-2xl text-base font-extrabold transition-all duration-200 border-3'
            if (answered) {
              if (opt === q.answer) cls += ' clay-card border-clay-success/30 animate-pop-in'
              else if (chosen === opt) cls += ' bg-clay-error/20 text-clay-error border-clay-error/30'
              else cls += ' bg-white/30 opacity-40 border-white/20'
            } else {
              cls += ' clay-card-interactive border-white/80'
            }
            return (
              <button key={i} onClick={() => handleAnswer(opt)} disabled={answered} className={cls} style={{ fontFamily: 'var(--font-display)' }}>
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-amber-50/80 rounded-2xl p-3 border-3 border-amber-200/50 w-full">
        <div className="grid grid-cols-5 gap-1" style={{ maxWidth: '220px', margin: '0 auto' }}>
          {[...Array(GRID * GRID)].map((_, cell) => {
            const row = Math.floor(cell / GRID)
            const col = cell % GRID
            const stepIdx = row * GRID + col
            const isPirate = stepIdx === steps && steps < maxSteps
            const isTreasure = cell === GRID * GRID - 1 && steps >= maxSteps
            const isReached = stepIdx < steps
            return (
              <div
                key={cell}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isTreasure ? 'bg-clay-yellow/40 text-lg animate-pop-in' :
                  isPirate ? 'bg-clay-primary/20 text-base animate-float' :
                  isReached ? 'bg-clay-success/20 text-clay-success' :
                  'bg-white/40 text-clay-text-muted/30'
                }`}
              >
                {isTreasure ? '\uD83D\uDC8E' : isPirate ? '\uD83C\uDFF4\u200D\u2620\uFE0F' : isReached ? '\u2713' : '\u00B7'}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-center font-semibold text-clay-text-muted mt-2">
          {steps >= maxSteps ? '🏆 Treasure found! Quest complete!' : `⚔️ ${steps}/${maxSteps} steps to the treasure`}
        </p>
      </div>
    </div>
  )
}

