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

function Clock({ time }: { time: string }) {
  const m = time.match(/(\d+):(\d+)/)
  if (!m) return null
  const h = parseInt(m[1])
  const mins = parseInt(m[2])
  const hourAngle = ((h % 12) + mins/60) * 30 - 90
  const minAngle = mins * 6 - 90
  const cx = 120, cy = 120, r = 100
  const hx = cx + Math.cos(hourAngle * Math.PI / 180) * r * 0.55
  const hy = cy + Math.sin(hourAngle * Math.PI / 180) * r * 0.55
  const mx = cx + Math.cos(minAngle * Math.PI / 180) * r * 0.8
  const my = cy + Math.sin(minAngle * Math.PI / 180) * r * 0.8
  return (
    <svg width="240" height="240" viewBox="0 0 240 240">
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke="#37474f" strokeWidth="6" />
      {[...Array(12)].map((_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180
        const x = cx + Math.cos(a) * r * 0.85
        const y = cy + Math.sin(a) * r * 0.85
        return <text key={i} x={x} y={y+6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#37474f">{i === 0 ? 12 : i}</text>
      })}
      <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#37474f" strokeWidth="7" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={mx} y2={my} stroke="#d32f2f" strokeWidth="4" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="#37474f" />
    </svg>
  )
}

export default function MathClock({ questions, unit, onCorrect, onWrong, onComplete }: Props) {
  const t = themeOf(unit.theme)
  const [qIdx, setQIdx] = useState(0)
  const [lock, setLock] = useState(false)
  const [help, setHelp] = useState(true)
  const [tapped, setTapped] = useState<string | null>(null)
  const [hp, setHp] = useState(3)

  const q = questions[qIdx]
  const total = questions.length
  const isClock = q?.prompt.toLowerCase().includes('waktu')

  const pick = (opt: string) => {
    if (lock || !q) return
    setLock(true)
    setTapped(opt)
    if (opt === q.answer) { playCorrect(); onCorrect() }
    else { playWrong(); onWrong(); setHp(h => Math.max(0, h-1)) }
    setTimeout(() => {
      setTapped(null)
      if (qIdx + 1 >= total) onComplete()
      else { setQIdx(i => i + 1); setLock(false) }
    }, 900)
  }

  if (help) {
    return (
      <div className="w-full max-w-md mx-auto rounded-3xl p-6 text-white text-center space-y-4" style={{ background: t.bg }}>
        <div className="text-6xl">🕰️🛡️</div>
        <h2 className="text-2xl font-extrabold">Menara Jam!</h2>
        <p className="font-semibold">Pertahankan kerajaan — baca jam, hari dan bulan. Salah = hilang satu nyawa.</p>
        <button onClick={() => setHelp(false)} className="bg-white text-black font-extrabold px-6 py-3 rounded-2xl">Pertahan ⚔️</button>
      </div>
    )
  }

  if (!q) return null

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <div className="flex justify-center gap-1 text-3xl">
        {[0,1,2].map(i => <span key={i}>{i < hp ? '❤️' : '🖤'}</span>)}
      </div>
      <div className="rounded-2xl p-4 text-center font-extrabold text-lg" style={{ background: t.primary, color: '#fff' }}>
        {q.prompt}
      </div>
      <div className="rounded-2xl p-4 flex items-center justify-center" style={{ background: t.bg }}>
        {isClock && q.display ? <Clock time={q.display} /> : <div className="text-5xl">📅</div>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {q.options.map(opt => (
          <button key={opt} onClick={() => pick(opt)} disabled={lock}
            className={`bg-white border-4 rounded-2xl py-3 font-extrabold text-lg shadow-md active:scale-95 ${
              tapped === opt && opt === q.answer ? 'bg-green-200' :
              tapped === opt && opt !== q.answer ? 'bg-red-200' : ''
            }`}
            style={{ borderColor: t.accent, color: t.primary }}>
            {opt}
          </button>
        ))}
      </div>
      <p className="text-clay-text-muted text-sm text-center font-semibold">Gelombang {qIdx + 1} / {total}</p>
    </div>
  )
}
