import { useState, useMemo, useEffect } from 'react'
import type { LessonTopic } from '../utils/types'
import { playCorrect, playWrong, playClick } from '../hooks/useSound'
import { Car } from 'lucide-react'

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

export default function SentenceBuilder({ words: _words, unit, onCorrect, onWrong, onComplete }: Props) {
  const sentences = useMemo(() => {
    const src = unit.phrases.length >= 4 ? unit.phrases : unit.sentences
    const clean = src.map(s => s.replace(/[.!?]$/, '').trim().toLowerCase())
    return shuffle(clean.filter(s => {
      const parts = s.split(/\s+/)
      return parts.length >= 3 && parts.length <= 7
    })).slice(0, 6)
  }, [unit])

  const [round, setRound] = useState(0)
  const [built, setBuilt] = useState<string[]>([])
  const [tiles, setTiles] = useState<string[]>([])
  const [wrongShake, setWrongShake] = useState(false)
  const maxRounds = sentences.length

  useEffect(() => {
    if (round < maxRounds) {
      const s = sentences[round]
      const parts = s.split(/\s+/)
      setTiles(shuffle([...parts]))
      setBuilt([])
    }
  }, [round, sentences.join(',')])

  if (maxRounds === 0) {
    return <div className="text-clay-text font-bold text-center p-8">Need more phrases for this unit!</div>
  }

  const target = sentences[round]
  const carp = Math.min(round / Math.max(maxRounds - 1, 1) * 10, 10)

  const addTile = (word: string) => {
    playClick()
    setBuilt(b => [...b, word])
    setTiles(t => { const idx = t.indexOf(word); return [...t.slice(0, idx), ...t.slice(idx + 1)] })
  }

  const removeTile = (idx: number) => {
    playClick()
    const word = built[idx]
    setBuilt(b => [...b.slice(0, idx), ...b.slice(idx + 1)])
    setTiles(t => [...t, word])
  }

  const checkSentence = () => {
    const answer = built.join(' ')
    if (answer === target) {
      playCorrect()
      onCorrect()
      if (round + 1 >= maxRounds) { setTimeout(onComplete, 600) }
      else { setTimeout(() => setRound(r => r + 1), 600) }
    } else {
      playWrong()
      onWrong()
      setWrongShake(true)
      setTimeout(() => setWrongShake(false), 500)
    }
  }

  const resetAll = () => {
    const s = sentences[round]
    setTiles(shuffle([...s.split(/\s+/)]))
    setBuilt([])
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xl mx-auto">
      <div className="clay-card px-5 py-2 text-center border-3 border-red-200 bg-red-50 w-full">
        <div className="text-2xl mb-0.5">🏎️🏁⚡</div>
        <p className="text-base font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          Build your race strategy! Put the words in the right order to win the championship!
        </p>
      </div>
      <div className="flex items-center gap-2 text-lg font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
        <Car className="w-6 h-6 text-clay-cta" strokeWidth={2.5} />
        Lap {round + 1}/{maxRounds}
      </div>

      <div className="w-full bg-clay-surface rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-3 bg-clay-cta/30 rounded-full flex-1 overflow-hidden">
            <div className="h-full bg-clay-cta rounded-full transition-all duration-500" style={{ width: `${(carp / 10) * 100}%` }} />
          </div>
          <Car className="w-5 h-5 text-clay-cta" strokeWidth={2.5} style={{ transform: `translateX(${carp * 8}px)` }} />
        </div>

        <div className={`flex flex-wrap gap-2 justify-center min-h-[52px] p-3 bg-white/50 rounded-2xl border-3 border-dashed border-clay-primary-light/40 ${wrongShake ? 'animate-wiggle' : ''}`}>
          {built.length === 0 && (
            <span className="text-clay-text-muted/50 font-semibold text-sm self-center">🏎️ Tap words below to plan the race strategy!</span>
          )}
          {built.map((w, i) => (
            <button
              key={`built-${i}-${w}`}
              onClick={() => removeTile(i)}
              className="clay-card px-3 py-1.5 rounded-xl text-base font-extrabold text-clay-text border-3 border-white/80 animate-pop-in"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {tiles.map((w, i) => (
          <button
            key={`tile-${i}-${w}`}
            onClick={() => addTile(w)}
            className="clay-card-interactive px-4 py-2 rounded-xl text-base font-extrabold text-clay-text border-3 border-white/80"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {w}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={checkSentence} disabled={built.length === 0} className="clay-button px-6 py-2.5 text-lg font-extrabold disabled:opacity-40 disabled:cursor-not-allowed">
          Check
        </button>
        <button onClick={resetAll} className="clay-card-interactive px-5 py-2.5 text-base font-extrabold text-clay-text border-3 border-white/80">
          Reset
        </button>
      </div>
    </div>
  )
}
