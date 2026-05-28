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

function Shape2D({ name, size = 120 }: { name: string; size?: number }) {
  const s = size, c = s/2
  switch (name) {
    case 'circle': return <svg width={s} height={s}><circle cx={c} cy={c} r={c-6} fill="#ff6b6b" stroke="#fff" strokeWidth="4"/></svg>
    case 'square': return <svg width={s} height={s}><rect x="6" y="6" width={s-12} height={s-12} fill="#48dbfb" stroke="#fff" strokeWidth="4"/></svg>
    case 'rectangle': return <svg width={s} height={s}><rect x="6" y="22" width={s-12} height={s-44} fill="#feca57" stroke="#fff" strokeWidth="4"/></svg>
    case 'triangle': return <svg width={s} height={s}><polygon points={`${c},6 ${s-6},${s-6} 6,${s-6}`} fill="#1dd1a1" stroke="#fff" strokeWidth="4"/></svg>
    case 'star': {
      const pts: string[] = []
      for (let i = 0; i < 10; i++) {
        const angle = (i * 36 - 90) * Math.PI / 180
        const rad = i % 2 === 0 ? c - 6 : c / 2.4
        pts.push(`${c + Math.cos(angle) * rad},${c + Math.sin(angle) * rad}`)
      }
      return <svg width={s} height={s}><polygon points={pts.join(' ')} fill="#ff9ff3" stroke="#fff" strokeWidth="3"/></svg>
    }
    case 'heart': return <svg width={s} height={s} viewBox="0 0 100 100"><path d="M50,82 C20,60 15,30 35,25 C45,22 50,32 50,38 C50,32 55,22 65,25 C85,30 80,60 50,82 Z" fill="#ee5253" stroke="#fff" strokeWidth="3"/></svg>
    case 'cube': return (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <polygon points="20,30 50,15 80,30 80,70 50,85 20,70" fill="#5f27cd" stroke="#fff" strokeWidth="2"/>
        <polygon points="20,30 50,45 80,30" fill="#341f7a" stroke="#fff" strokeWidth="2"/>
        <polygon points="50,45 50,85 80,70 80,30" fill="#4527a0" stroke="#fff" strokeWidth="2"/>
      </svg>
    )
    case 'sphere': return (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <defs><radialGradient id="sph" cx="0.35" cy="0.35"><stop offset="0%" stopColor="#fff"/><stop offset="100%" stopColor="#ff6b6b"/></radialGradient></defs>
        <circle cx="50" cy="50" r="40" fill="url(#sph)" stroke="#fff" strokeWidth="2"/>
      </svg>
    )
    case 'cone': return (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <polygon points="50,15 20,80 80,80" fill="#feca57" stroke="#fff" strokeWidth="2"/>
        <ellipse cx="50" cy="80" rx="30" ry="8" fill="#d4a73e" stroke="#fff" strokeWidth="2"/>
      </svg>
    )
    case 'cylinder': return (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <rect x="25" y="25" width="50" height="55" fill="#48dbfb" stroke="#fff" strokeWidth="2"/>
        <ellipse cx="50" cy="25" rx="25" ry="8" fill="#2e86de" stroke="#fff" strokeWidth="2"/>
        <ellipse cx="50" cy="80" rx="25" ry="8" fill="#48dbfb" stroke="#fff" strokeWidth="2"/>
      </svg>
    )
    case 'pyramid': return (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <polygon points="50,15 20,80 80,80" fill="#1dd1a1" stroke="#fff" strokeWidth="2"/>
        <polygon points="50,15 80,80 65,85" fill="#0f8a6a" stroke="#fff" strokeWidth="2"/>
      </svg>
    )
    default: return <div className="text-6xl">❓</div>
  }
}

export default function MathShape({ questions, unit, onCorrect, onWrong, onComplete }: Props) {
  const t = themeOf(unit.theme)
  const [qIdx, setQIdx] = useState(0)
  const [lock, setLock] = useState(false)
  const [help, setHelp] = useState(true)
  const [tapped, setTapped] = useState<string | null>(null)

  const q = questions[qIdx]
  const total = questions.length

  const pick = (opt: string) => {
    if (lock || !q) return
    setLock(true); setTapped(opt)
    if (opt === q.answer) { playCorrect(); onCorrect() } else { playWrong(); onWrong() }
    setTimeout(() => {
      setTapped(null)
      if (qIdx + 1 >= total) onComplete()
      else { setQIdx(i => i + 1); setLock(false) }
    }, 800)
  }

  if (help) {
    return (
      <div className="w-full max-w-md mx-auto rounded-3xl p-6 text-white text-center space-y-4" style={{ background: t.bg }}>
        <div className="text-6xl">🔷🚀</div>
        <h2 className="text-2xl font-extrabold">Skuad Bentuk!</h2>
        <p className="font-semibold">Terbangkan roket — kenal pasti bentuk di skrin untuk kunci sasaran.</p>
        <button onClick={() => setHelp(false)} className="bg-white text-black font-extrabold px-6 py-3 rounded-2xl">Lancar 🚀</button>
      </div>
    )
  }

  if (!q) return null

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <div className="rounded-2xl p-4 text-center font-extrabold text-xl" style={{ background: t.primary, color: '#fff' }}>
        {q.prompt}
      </div>
      <div className="rounded-2xl p-6 flex items-center justify-center" style={{ background: t.bg, minHeight: 180 }}>
        {q.display && <Shape2D name={q.display} size={140} />}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {q.options.map(opt => (
          <button key={opt} onClick={() => pick(opt)} disabled={lock}
            className={`bg-white border-4 rounded-2xl py-4 font-extrabold text-lg shadow-md active:scale-95 capitalize ${
              tapped === opt && opt === q.answer ? 'bg-green-200' :
              tapped === opt && opt !== q.answer ? 'bg-red-200' : ''
            }`}
            style={{ borderColor: t.accent, color: t.primary }}>
            {opt}
          </button>
        ))}
      </div>
      <p className="text-clay-text-muted text-sm text-center font-semibold">Sasaran {qIdx + 1} / {total}</p>
    </div>
  )
}
