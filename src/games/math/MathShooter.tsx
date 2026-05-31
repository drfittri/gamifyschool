import { useEffect, useRef, useState } from 'react'
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

type Target = { x: number; y: number; vx: number; vy: number; label: string; correct: boolean; alive: boolean; r: number }

export default function MathShooter({ questions, unit, onCorrect, onWrong, onComplete }: Props) {
  const t = themeOf(unit.theme)
  const cvsRef = useRef<HTMLCanvasElement>(null)
  const [qIdx, setQIdx] = useState(0)
  const [showHelp, setShowHelp] = useState(true)
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null)
  const targetsRef = useRef<Target[]>([])
  const sizeRef = useRef({ w: 360, h: 480 })
  const lockRef = useRef(false)

  const q = questions[qIdx]

  // spawn targets when question changes
  useEffect(() => {
    if (!q || showHelp) return
    const { w } = sizeRef.current
    const opts = q.options
    targetsRef.current = opts.map((label, i) => ({
      x: 40 + (i * (w - 80)) / Math.max(1, opts.length - 1),
      y: 60 + (i % 2) * 30,
      vx: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.6),
      vy: 0.2 + Math.random() * 0.3,
      label,
      correct: label === q.answer,
      alive: true,
      r: 34,
    }))
    lockRef.current = false
    setFeedback(null)
  }, [qIdx, showHelp])

  // canvas render loop
  useEffect(() => {
    if (showHelp) return
    const cvs = cvsRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const setSize = () => {
      cvs.width = cvs.clientWidth * dpr
      cvs.height = cvs.clientHeight * dpr
      sizeRef.current = { w: cvs.clientWidth, h: cvs.clientHeight }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    setSize()
    window.addEventListener('resize', setSize)

    let raf = 0
    const loop = () => {
      const { w, h } = sizeRef.current
      // bg
      ctx.fillStyle = '#0b1020'
      ctx.fillRect(0, 0, w, h)
      // theme bg gradient
      const g = ctx.createLinearGradient(0, 0, 0, h)
      const stops = t.bg.match(/#[0-9a-f]+/gi) || ['#222', '#000']
      g.addColorStop(0, stops[0])
      g.addColorStop(1, stops[1])
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      // stars / scenery
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        const sx = ((i * 73) % w)
        const sy = ((i * 131 + Date.now() / 40) % h)
        ctx.fillRect(sx, sy, 2, 2)
      }

      // crosshair bottom (player)
      ctx.font = '40px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(t.hero, w / 2, h - 40)

      // targets
      targetsRef.current.forEach(tgt => {
        if (!tgt.alive) return
        tgt.x += tgt.vx
        tgt.y += tgt.vy
        if (tgt.x < tgt.r || tgt.x > w - tgt.r) tgt.vx *= -1
        if (tgt.y < tgt.r + 30 || tgt.y > h * 0.55) tgt.vy *= -1
        // target circle
        ctx.beginPath()
        ctx.arc(tgt.x, tgt.y, tgt.r, 0, Math.PI * 2)
        ctx.fillStyle = t.primary
        ctx.fill()
        ctx.lineWidth = 4
        ctx.strokeStyle = t.accent
        ctx.stroke()
        // label
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 18px sans-serif'
        ctx.fillText(tgt.label, tgt.x, tgt.y)
      })

      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', setSize) }
  }, [showHelp, t])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (lockRef.current || !q) return
    const cvs = cvsRef.current!
    const rect = cvs.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const hit = targetsRef.current.find(tg => tg.alive && Math.hypot(tg.x - x, tg.y - y) < tg.r + 4)
    if (!hit) return
    lockRef.current = true
    if (hit.correct) {
      hit.alive = false
      playCorrect()
      onCorrect()
      setFeedback('ok')
    } else {
      hit.alive = false
      playWrong()
      onWrong()
      setFeedback('bad')
    }
    setTimeout(() => {
      if (qIdx + 1 >= questions.length) onComplete()
      else setQIdx(i => i + 1)
    }, 800)
  }

  if (showHelp) {
    return (
      <div className="w-full max-w-md mx-auto rounded-3xl p-6 text-white text-center space-y-4" style={{ background: t.bg }}>
        <div className="text-5xl">{t.hero}🎯</div>
        <h2 className="text-2xl font-extrabold">Tembak Sasaran!</h2>
        <p className="font-semibold">Baca soalan matematik, kemudian KETIK sasaran yang betul.</p>
        <button onClick={() => setShowHelp(false)} className="bg-white text-black font-extrabold px-6 py-3 rounded-2xl">Mula ▶</button>
      </div>
    )
  }

  if (!q) return null

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <div className="rounded-2xl p-4 text-center font-extrabold text-lg" style={{ background: t.primary, color: '#fff' }}>
        {q.prompt}
      </div>
      {q.display && (
        <div className="rounded-2xl p-3 flex items-center justify-center bg-white/90 min-h-[120px]">
          <QDisplay q={q} />
        </div>
      )}
      <canvas
        ref={cvsRef}
        onClick={handleClick}
        className="w-full rounded-2xl cursor-crosshair"
        style={{ height: 420, background: '#000', touchAction: 'manipulation' }}
      />
      {feedback && (
        <div className={`text-center font-extrabold text-2xl ${feedback === 'ok' ? 'text-green-500' : 'text-red-500'}`}>
          {feedback === 'ok' ? '🎯 Kena!' : '❌ Tersasar!'}
        </div>
      )}
      <p className="text-clay-text-muted text-sm text-center font-semibold">Soalan {qIdx + 1} / {questions.length}</p>
    </div>
  )
}
