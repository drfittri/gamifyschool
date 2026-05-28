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

function ScaleSVG({ left, right, type }: { left: number; right: number; type: 'length' | 'mass' | 'vol' }) {
  if (type === 'length') {
    return (
      <div className="flex items-end gap-8 justify-center h-40">
        <div className="flex flex-col items-center">
          <div className="bg-green-400 rounded-t-full" style={{ width: 40, height: left * 5 + 20 }} />
          <div className="text-sm font-extrabold mt-1 text-white">A</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-blue-400 rounded-t-full" style={{ width: 40, height: right * 5 + 20 }} />
          <div className="text-sm font-extrabold mt-1 text-white">B</div>
        </div>
      </div>
    )
  }
  if (type === 'mass') {
    const tilt = left > right ? -10 : left < right ? 10 : 0
    return (
      <div className="relative h-44 flex items-center justify-center">
        <div className="relative" style={{ transform: `rotate(${tilt}deg)`, transformOrigin: 'center bottom', transition: 'transform 0.5s' }}>
          <div className="w-48 h-2 bg-gray-700" />
          <div className="absolute -left-8 -top-12 w-16 h-12 bg-amber-300 border-4 border-amber-600 rounded-lg flex items-center justify-center font-extrabold">{left}kg</div>
          <div className="absolute -right-8 -top-12 w-16 h-12 bg-amber-300 border-4 border-amber-600 rounded-lg flex items-center justify-center font-extrabold">{right}kg</div>
        </div>
        <div className="absolute bottom-0 w-2 h-32 bg-gray-700" />
        <div className="absolute bottom-0 text-3xl">🔻</div>
      </div>
    )
  }
  // volume - jugs
  return (
    <div className="flex items-end gap-8 justify-center h-44">
      <div className="relative w-20 h-40 border-4 border-gray-300 rounded-b-2xl overflow-hidden bg-white/30">
        <div className="absolute bottom-0 w-full bg-blue-500" style={{ height: `${Math.min(100, left*10)}%` }} />
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm font-extrabold text-white">{left}L</div>
      </div>
      <div className="relative w-20 h-40 border-4 border-gray-300 rounded-b-2xl overflow-hidden bg-white/30">
        <div className="absolute bottom-0 w-full bg-cyan-500" style={{ height: `${Math.min(100, right*10)}%` }} />
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm font-extrabold text-white">{right}L</div>
      </div>
    </div>
  )
}

export default function MathBalance({ questions, unit, onCorrect, onWrong, onComplete }: Props) {
  const t = themeOf(unit.theme)
  const [qIdx, setQIdx] = useState(0)
  const [lock, setLock] = useState(false)
  const [help, setHelp] = useState(true)
  const [tapped, setTapped] = useState<string | null>(null)

  const q = questions[qIdx]
  const total = questions.length

  // parse type + values
  const meta = (() => {
    if (!q) return null
    const sep = q.display?.includes('|') ? '|' : q.display?.includes('vs') ? 'vs' : '~'
    const parts = q.display?.split(sep) || ['1','1']
    const left = parseInt(parts[0]), right = parseInt(parts[1])
    const type: 'length' | 'mass' | 'vol' = q.prompt.includes('LONG') || q.prompt.includes('SHORT') ? 'length'
      : q.prompt.includes('HEAVI') || q.prompt.includes('LIGHT') ? 'mass' : 'vol'
    return { left, right, type }
  })()

  const pick = (opt: string) => {
    if (lock || !q) return
    setLock(true); setTapped(opt)
    if (opt === q.answer) { playCorrect(); onCorrect() } else { playWrong(); onWrong() }
    setTimeout(() => {
      setTapped(null)
      if (qIdx + 1 >= total) onComplete()
      else { setQIdx(i => i + 1); setLock(false) }
    }, 900)
  }

  if (help) {
    return (
      <div className="w-full max-w-md mx-auto rounded-3xl p-6 text-white text-center space-y-4" style={{ background: t.bg }}>
        <div className="text-6xl">⚖️🐮</div>
        <h2 className="text-2xl font-extrabold">Farm Balance!</h2>
        <p className="font-semibold">Compare lengths, weights and water jugs. Pick the right one to win the farmyard!</p>
        <button onClick={() => setHelp(false)} className="bg-white text-black font-extrabold px-6 py-3 rounded-2xl">Compare 👀</button>
      </div>
    )
  }

  if (!q || !meta) return null

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <div className="rounded-2xl p-4 text-center font-extrabold text-xl" style={{ background: t.primary, color: '#fff' }}>
        {q.prompt}
      </div>
      <div className="rounded-2xl p-4" style={{ background: t.bg }}>
        <ScaleSVG left={meta.left} right={meta.right} type={meta.type} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {q.options.map(opt => (
          <button key={opt} onClick={() => pick(opt)} disabled={lock}
            className={`bg-white border-4 rounded-2xl py-4 font-extrabold text-lg shadow-md active:scale-95 ${
              tapped === opt && opt === q.answer ? 'bg-green-200' :
              tapped === opt && opt !== q.answer ? 'bg-red-200' : ''
            }`}
            style={{ borderColor: t.accent, color: t.primary }}>
            {opt}
          </button>
        ))}
      </div>
      <p className="text-clay-text-muted text-sm text-center font-semibold">Round {qIdx + 1} / {total}</p>
    </div>
  )
}
