import { useState } from 'react'
import { playCorrect, playWrong } from '../../hooks/useSound'
import { themeOf } from './themeUtil'
import type { MathQuestion, MathUnit } from '../../data/math'

interface Props {
  questions: MathQuestion[]
  unit: MathUnit
  onCorrect: () => void
  onWrong: () => void
  onComplete: () => void
}

export default function MathCoin({ questions, unit, onCorrect, onWrong, onComplete }: Props) {
  const t = themeOf(unit.theme)
  const [qIdx, setQIdx] = useState(0)
  const [lock, setLock] = useState(false)
  const [help, setHelp] = useState(true)
  const [tapped, setTapped] = useState<string | null>(null)
  const [chestPos, setChestPos] = useState(0)

  const q = questions[qIdx]
  const total = questions.length

  const pick = (opt: string) => {
    if (lock || !q) return
    setLock(true)
    setTapped(opt)
    if (opt === q.answer) {
      playCorrect(); onCorrect()
      setChestPos(p => p + 1)
    } else { playWrong(); onWrong() }
    setTimeout(() => {
      setTapped(null)
      if (qIdx + 1 >= total) onComplete()
      else { setQIdx(i => i + 1); setLock(false) }
    }, 800)
  }

  if (help) {
    return (
      <div className="w-full max-w-md mx-auto rounded-3xl p-6 text-white text-center space-y-4" style={{ background: t.bg }}>
        <div className="text-6xl">🏴‍☠️🪙</div>
        <h2 className="text-2xl font-extrabold">Cari Duit!</h2>
        <p className="font-semibold">Baca harga. Bayar jumlah yang betul. Setiap jawapan betul mengisi peti harta karun.</p>
        <button onClick={() => setHelp(false)} className="bg-white text-black font-extrabold px-6 py-3 rounded-2xl">Cari! 💰</button>
      </div>
    )
  }

  if (!q) return null

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <div className="rounded-2xl p-3 flex items-center justify-around" style={{ background: t.bg }}>
        <div className="text-5xl">🏴‍☠️</div>
        <div className="text-3xl font-extrabold text-white">{chestPos} / {total}</div>
        <div className="text-5xl">{chestPos >= total ? '👑' : chestPos > total/2 ? '💰' : '📦'}</div>
      </div>
      <div className="rounded-2xl p-4 text-center font-extrabold text-xl" style={{ background: t.primary, color: '#fff' }}>
        {q.prompt}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {q.options.map(opt => (
          <button key={opt} onClick={() => pick(opt)} disabled={lock}
            className={`bg-white border-4 rounded-2xl py-4 font-extrabold text-lg shadow-md active:scale-95 ${
              tapped === opt && opt === q.answer ? 'bg-green-200' :
              tapped === opt && opt !== q.answer ? 'bg-red-200' : ''
            }`}
            style={{ borderColor: t.accent, color: t.primary }}>
            🪙 {opt}
          </button>
        ))}
      </div>
      <p className="text-clay-text-muted text-sm text-center font-semibold">Harta {qIdx + 1} / {total}</p>
    </div>
  )
}
