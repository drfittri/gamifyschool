import { useState, useMemo } from 'react'
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

const COUNT_EMOJI: Record<string, string> = {
  army: '🪖', jet: '✈️', rocket: '🚀', race: '🚗',
  animal: '🐰', pirate: '🪙', knight: '🛡️', farm: '🐔',
}

export default function MathCount({ questions, unit, onCorrect, onWrong, onComplete }: Props) {
  const t = themeOf(unit.theme)
  const themeEmoji = COUNT_EMOJI[unit.theme] || '⭐'
  const [qIdx, setQIdx] = useState(0)
  const [lock, setLock] = useState(false)
  const [help, setHelp] = useState(true)
  const [tapped, setTapped] = useState<string | null>(null)

  const q = questions[qIdx]
  const total = questions.length

  // for unit 1 count question, override display with theme emoji
  const display = useMemo(() => {
    if (!q) return ''
    if (q.prompt.includes('Kira') && q.display) {
      const matched = q.display.match(/.{1,2}/gu) || []
      return themeEmoji.repeat(Math.min(30, matched.length))
    }
    return q.display || ''
  }, [q, themeEmoji])

  const pick = (opt: string) => {
    if (lock || !q) return
    setLock(true)
    setTapped(opt)
    if (opt === q.answer) {
      playCorrect(); onCorrect()
    } else {
      playWrong(); onWrong()
    }
    setTimeout(() => {
      setTapped(null)
      if (qIdx + 1 >= total) onComplete()
      else { setQIdx(i => i + 1); setLock(false) }
    }, 800)
  }

  if (help) {
    return (
      <div className="w-full max-w-md mx-auto rounded-3xl p-6 text-white text-center space-y-4" style={{ background: t.bg }}>
        <div className="text-5xl">{themeEmoji.repeat(5)}</div>
        <h2 className="text-2xl font-extrabold">Kira Pasukan!</h2>
        <p className="font-semibold">Kira dengan teliti. Ketik nombor yang betul.</p>
        <button onClick={() => setHelp(false)} className="bg-white text-black font-extrabold px-6 py-3 rounded-2xl">Mula 👀</button>
      </div>
    )
  }

  if (!q) return null

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <div className="rounded-2xl p-4 text-center font-extrabold text-xl" style={{ background: t.primary, color: '#fff' }}>
        {q.prompt}
      </div>
      <div className="rounded-2xl p-6 min-h-[180px] flex items-center justify-center" style={{ background: t.bg }}>
        <div className="text-3xl leading-tight text-center break-words" style={{ wordSpacing: '0.2em' }}>
          {display.split('|').length > 1 ? (
            display.split('|').map((row, i) => <div key={i} className="my-1">{row}</div>)
          ) : display}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {q.options.map(opt => (
          <button key={opt} onClick={() => pick(opt)} disabled={lock}
            className={`bg-white border-4 rounded-2xl py-4 font-extrabold text-xl shadow-md active:scale-95 ${
              tapped === opt && opt === q.answer ? 'bg-green-200' :
              tapped === opt && opt !== q.answer ? 'bg-red-200' : ''
            }`}
            style={{ borderColor: t.accent, color: t.primary }}>
            {opt}
          </button>
        ))}
      </div>
      <p className="text-clay-text-muted text-sm text-center font-semibold">Soalan {qIdx + 1} / {total}</p>
    </div>
  )
}
