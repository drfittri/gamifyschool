import { useEffect, useState } from 'react'
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

export default function MathRocket({ questions, unit, onCorrect, onWrong, onComplete }: Props) {
  const t = themeOf(unit.theme)
  const [qIdx, setQIdx] = useState(0)
  const [altitude, setAltitude] = useState(0)
  const [showHelp, setShowHelp] = useState(true)
  const [lock, setLock] = useState(false)
  const [shake, setShake] = useState(false)
  const [launched, setLaunched] = useState(false)

  const q = questions[qIdx]
  const total = questions.length
  const progressPct = Math.min(100, (altitude / total) * 100)

  const pick = (opt: string) => {
    if (lock || !q) return
    setLock(true)
    if (opt === q.answer) {
      playCorrect()
      onCorrect()
      setAltitude(a => a + 1)
      setTimeout(() => {
        if (qIdx + 1 >= total) { setLaunched(true); setTimeout(onComplete, 1500) }
        else { setQIdx(i => i + 1); setLock(false) }
      }, 700)
    } else {
      playWrong()
      onWrong()
      setShake(true)
      setTimeout(() => { setShake(false); setLock(false) }, 500)
    }
  }

  useEffect(() => { if (launched) onComplete() }, [launched])

  if (showHelp) {
    return (
      <div className="w-full max-w-md mx-auto rounded-3xl p-6 text-white text-center space-y-4" style={{ background: t.bg }}>
        <div className="text-6xl animate-bounce">🚀</div>
        <h2 className="text-2xl font-extrabold">Lancar Roket!</h2>
        <p className="font-semibold">Setiap jawapan betul = +1 altitud. Capai orbit dengan jawab semua soalan dengan betul.</p>
        <button onClick={() => setShowHelp(false)} className="bg-white text-black font-extrabold px-6 py-3 rounded-2xl">Nyala 🔥</button>
      </div>
    )
  }

  if (!q) return null

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <div className="relative rounded-2xl overflow-hidden" style={{ background: t.bg, height: 360 }}>
        {/* stars */}
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="absolute w-0.5 h-0.5 bg-white" style={{ top: `${(i*37)%100}%`, left: `${(i*53)%100}%`, opacity: 0.7 }} />
        ))}
        {/* moon */}
        <div className="absolute text-4xl" style={{ top: 10, right: 20 }}>🌙</div>
        {/* rocket */}
        <div
          className={`absolute left-1/2 text-6xl ${shake ? 'animate-pulse' : ''}`}
          style={{
            bottom: `${10 + progressPct * 0.7}%`,
            transform: `translateX(-50%) ${launched ? 'scale(1.3)' : ''}`,
            transition: 'bottom 0.6s ease, transform 0.4s',
            textShadow: '0 0 20px rgba(255,200,0,0.8)',
          }}
        >🚀</div>
        {/* flames when launched */}
        {launched && <div className="absolute left-1/2 -translate-x-1/2 text-5xl animate-pulse" style={{ bottom: 10 }}>🔥🔥🔥</div>}
        {/* altitude bar */}
        <div className="absolute right-2 top-2 bottom-2 w-3 bg-black/40 rounded-full">
          <div className="absolute bottom-0 w-full rounded-full" style={{ height: `${progressPct}%`, background: t.accent }} />
        </div>
      </div>

      <div className="rounded-2xl p-4 text-center font-extrabold text-xl" style={{ background: t.primary, color: '#fff' }}>
        {q.prompt}
        {q.display && q.display.length < 30 && <div className="text-2xl mt-1">{q.display}</div>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {q.options.map(opt => (
          <button
            key={opt}
            onClick={() => pick(opt)}
            disabled={lock}
            className="bg-white border-4 rounded-2xl py-4 font-extrabold text-xl shadow-md active:scale-95 transition"
            style={{ borderColor: t.accent, color: t.primary }}
          >
            {opt}
          </button>
        ))}
      </div>
      <p className="text-clay-text-muted text-sm text-center font-semibold">Altitud {altitude} / {total} — terus naik!</p>
    </div>
  )
}
