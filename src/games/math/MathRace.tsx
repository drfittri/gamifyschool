import { useState } from 'react'
import { playCorrect, playWrong } from '../../hooks/useSound'
import { themeOf } from './themeUtil'
import QDisplay from './QDisplay'
import type { MathQuestion, MathUnit } from '../../data/math'

interface Props {
  questions: MathQuestion[]
  unit: MathUnit
  onCorrect: () => void
  onWrong: () => void
  onComplete: () => void
}

const RACERS: Record<string, string[]> = {
  race: ['🏎️', '🏁'],
  animal: ['🐯', '🌴'],
  army: ['🪖', '🚩'],
  jet: ['✈️', '🌤️'],
  rocket: ['🚀', '🌟'],
  pirate: ['🏴‍☠️', '💰'],
  knight: ['🐴', '🏰'],
  farm: ['🐮', '🌾'],
}

export default function MathRace({ questions, unit, onCorrect, onWrong, onComplete }: Props) {
  const t = themeOf(unit.theme)
  const [racer, finish] = RACERS[unit.theme] || RACERS.race
  const [qIdx, setQIdx] = useState(0)
  const [pos, setPos] = useState(0)
  const [oppPos, setOppPos] = useState(0)
  const [lock, setLock] = useState(false)
  const [help, setHelp] = useState(true)
  const [boost, setBoost] = useState(false)

  const q = questions[qIdx]
  const total = questions.length

  const pick = (opt: string) => {
    if (lock || !q) return
    setLock(true)
    if (opt === q.answer) {
      playCorrect()
      onCorrect()
      setPos(p => Math.min(100, p + 100 / total))
      setOppPos(p => Math.min(100, p + 100 / total * 0.55))
      setBoost(true)
      setTimeout(() => setBoost(false), 400)
      setTimeout(() => {
        if (qIdx + 1 >= total) onComplete()
        else { setQIdx(i => i + 1); setLock(false) }
      }, 700)
    } else {
      playWrong()
      onWrong()
      setOppPos(p => Math.min(100, p + 100 / total * 1.1))
      setTimeout(() => setLock(false), 500)
    }
  }

  if (help) {
    return (
      <div className="w-full max-w-md mx-auto rounded-3xl p-6 text-white text-center space-y-4" style={{ background: t.bg }}>
        <div className="text-6xl">{racer} 💨</div>
        <h2 className="text-2xl font-extrabold">Lumba Pantas!</h2>
        <p className="font-semibold">Jawapan betul = pecut. Salah = lawan memintas. Kalahkan lawan ke bendera {finish}!</p>
        <button onClick={() => setHelp(false)} className="bg-white text-black font-extrabold px-6 py-3 rounded-2xl">Berlumba! 🏁</button>
      </div>
    )
  }

  if (!q) return null

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <div className="rounded-2xl p-3 space-y-3" style={{ background: t.bg }}>
        {/* Player track */}
        <div className="relative bg-black/30 h-12 rounded-xl border-2 border-white/40">
          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-2xl">{finish}</div>
          <div
            className={`absolute top-1/2 -translate-y-1/2 text-3xl ${boost ? 'scale-125' : ''}`}
            style={{ left: `${pos}%`, transition: 'left 0.5s, transform 0.2s' }}
          >{racer}</div>
        </div>
        {/* Opponent track */}
        <div className="relative bg-black/30 h-12 rounded-xl border-2 border-red-400/60">
          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-2xl">{finish}</div>
          <div className="absolute top-1/2 -translate-y-1/2 text-3xl grayscale" style={{ left: `${oppPos}%`, transition: 'left 0.5s' }}>{racer}</div>
        </div>
      </div>

      <div className="rounded-2xl p-4 text-center font-extrabold text-xl" style={{ background: t.primary, color: '#fff' }}>
        {q.prompt}
      </div>
      {q.display && (
        <div className="rounded-2xl p-3 flex items-center justify-center bg-white/90 min-h-[120px]">
          <QDisplay q={q} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {q.options.map(opt => (
          <button key={opt} onClick={() => pick(opt)} disabled={lock}
            className="bg-white border-4 rounded-2xl py-4 font-extrabold text-xl shadow-md active:scale-95"
            style={{ borderColor: t.accent, color: t.primary }}>
            {opt}
          </button>
        ))}
      </div>
      <p className="text-clay-text-muted text-sm text-center font-semibold">Pusingan {qIdx + 1} / {total}</p>
    </div>
  )
}
