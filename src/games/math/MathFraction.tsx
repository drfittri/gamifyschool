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

// Render a pizza with `num` of `den` slices shaded
function Pizza({ num, den, size = 200 }: { num: number; den: number; size?: number }) {
  const r = size / 2
  const cx = r, cy = r
  const slices = []
  for (let i = 0; i < den; i++) {
    const a1 = (i / den) * Math.PI * 2 - Math.PI / 2
    const a2 = ((i + 1) / den) * Math.PI * 2 - Math.PI / 2
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy + r * Math.sin(a1)
    const x2 = cx + r * Math.cos(a2)
    const y2 = cy + r * Math.sin(a2)
    const large = a2 - a1 > Math.PI ? 1 : 0
    const shaded = i < num
    slices.push(
      <path key={i}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
        fill={shaded ? '#ff6b35' : '#fff5b0'}
        stroke="#8b4513" strokeWidth="3" />
    )
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r-1} fill="#fff5b0" stroke="#8b4513" strokeWidth="3" />
      {slices}
    </svg>
  )
}

export default function MathFraction({ questions, unit, onCorrect, onWrong, onComplete }: Props) {
  const t = themeOf(unit.theme)
  const [qIdx, setQIdx] = useState(0)
  const [lock, setLock] = useState(false)
  const [help, setHelp] = useState(true)
  const [tapped, setTapped] = useState<string | null>(null)

  const q = questions[qIdx]
  const total = questions.length

  // parse a/b from q.display
  const frac = (() => {
    if (!q?.display) return { num: 1, den: 2 }
    const m = q.display.match(/(\d+)\/(\d+)/)
    return m ? { num: parseInt(m[1]), den: parseInt(m[2]) } : { num: 1, den: 2 }
  })()

  const pick = (opt: string) => {
    if (lock || !q) return
    setLock(true)
    setTapped(opt)
    if (opt === q.answer) { playCorrect(); onCorrect() }
    else { playWrong(); onWrong() }
    setTimeout(() => {
      setTapped(null)
      if (qIdx + 1 >= total) onComplete()
      else { setQIdx(i => i + 1); setLock(false) }
    }, 900)
  }

  if (help) {
    return (
      <div className="w-full max-w-md mx-auto rounded-3xl p-6 text-white text-center space-y-4" style={{ background: t.bg }}>
        <div className="text-6xl">🍕</div>
        <h2 className="text-2xl font-extrabold">Potong Piza!</h2>
        <p className="font-semibold">Lanun suka piza! Pilih pecahan yang padan dengan keping berlorek.</p>
        <button onClick={() => setHelp(false)} className="bg-white text-black font-extrabold px-6 py-3 rounded-2xl">Potong! 🔪</button>
      </div>
    )
  }

  if (!q) return null

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <div className="rounded-2xl p-4 text-center font-extrabold text-lg" style={{ background: t.primary, color: '#fff' }}>
        {q.prompt}
      </div>
      <div className="rounded-2xl p-6 flex items-center justify-center" style={{ background: t.bg }}>
        <Pizza num={frac.num} den={frac.den} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {q.options.map(opt => (
          <button key={opt} onClick={() => pick(opt)} disabled={lock}
            className={`bg-white border-4 rounded-2xl py-4 font-extrabold text-2xl shadow-md active:scale-95 ${
              tapped === opt && opt === q.answer ? 'bg-green-200' :
              tapped === opt && opt !== q.answer ? 'bg-red-200' : ''
            }`}
            style={{ borderColor: t.accent, color: t.primary }}>
            {opt}
          </button>
        ))}
      </div>
      <p className="text-clay-text-muted text-sm text-center font-semibold">Hirisan {qIdx + 1} / {total}</p>
    </div>
  )
}
