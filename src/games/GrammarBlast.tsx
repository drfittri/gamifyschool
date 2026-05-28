import { useEffect, useMemo, useRef, useState } from 'react'
import { playCorrect, playWrong } from '../hooks/useSound'

interface Props {
  words: string[]
  onCorrect: () => void
  onWrong: () => void
  onComplete: () => void
}

const BASE = import.meta.env.BASE_URL
const ASSET = (p: string) => `${BASE}${p.replace(/^\//, '')}`

interface GrammarQ { sentence: string; options: [string, string]; answer: string }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}
function startsWithVowel(w: string) { return /^[aeiou]/i.test(w) }

function buildQuestions(words: string[]): GrammarQ[] {
  const pool = words.filter(w => w.length >= 3 && /^[a-z]+$/i.test(w))
  const qs: GrammarQ[] = []
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const w = pool[Math.floor(Math.random() * pool.length)]
    const art = startsWithVowel(w) ? 'an' : 'a'
    qs.push({ sentence: `___ ${w}`, options: [art, art === 'a' ? 'an' : 'a'], answer: art })
  }
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const w = pool[Math.floor(Math.random() * pool.length)]
    const singular = Math.random() > 0.5
    const subj = singular ? `The ${w}` : `The ${w}s`
    const verb = singular ? 'is' : 'are'
    qs.push({ sentence: `${subj} ___ big.`, options: [verb, singular ? 'are' : 'is'], answer: verb })
  }
  return shuffle(qs).slice(0, 5)
}

type Projectile = { x: number; y: number; vx: number; vy: number; alive: boolean }

export default function GrammarBlast({ words, onCorrect, onWrong, onComplete }: Props) {
  const questions = useMemo(() => buildQuestions(words.slice(0, 12)), [words.join('|')])
  const [showInstructions, setShowInstructions] = useState(true)
  const [index, setIndex] = useState(0)
  const [angle, setAngle] = useState(45)  // degrees from horizontal
  const [power, setPower] = useState(60)
  const [firing, setFiring] = useState(false)
  const [resolved, setResolved] = useState<null | 'correct' | 'wrong'>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const projRef = useRef<Projectile>({ x: 0, y: 0, vx: 0, vy: 0, alive: false })
  const optionPositionsRef = useRef<{ x: number; y: number; r: number; label: string }[]>([])
  const expRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const sprites = useRef<Record<string, HTMLImageElement>>({})

  useEffect(() => {
    ['tanks/bullet.png', 'tanks/blue.png', 'tanks/green.png', 'tanks/grey.png', 'tanks/desert.png', 'tanks/explosion.png'].forEach(p => {
      if (!sprites.current[p]) {
        const img = new Image(); img.src = ASSET(`assets/${p}`); sprites.current[p] = img
      }
    })
  }, [])

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const W = (cvs.width = cvs.clientWidth * dpr)
    const H = (cvs.height = cvs.clientHeight * dpr)

    const cannonX = 60 * dpr
    const cannonY = H - 50 * dpr
    const groundY = H - 20 * dpr

    // option fortresses positions (right side)
    const q = questions[index]
    if (!q) return
    optionPositionsRef.current = [
      { x: W - 240 * dpr, y: groundY - 50 * dpr, r: 45 * dpr, label: q.options[0] },
      { x: W - 90 * dpr, y: groundY - 50 * dpr, r: 45 * dpr, label: q.options[1] },
    ]

    let raf = 0
    let last = performance.now()
    const draw = (now: number) => {
      const dt = Math.min(40, now - last); last = now

      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#FEF3C7'); sky.addColorStop(1, '#FCD34D')
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)

      // ground
      ctx.fillStyle = '#92400E'
      ctx.fillRect(0, groundY, W, H - groundY)

      // grass strip
      ctx.fillStyle = '#65A30D'
      ctx.fillRect(0, groundY - 4 * dpr, W, 4 * dpr)

      // fortresses
      for (const pos of optionPositionsRef.current) {
        // tank body
        const tankImg = sprites.current['tanks/green.png']
        const tw = 90 * dpr, th = 90 * dpr
        if (tankImg.complete && tankImg.naturalWidth) {
          ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(-Math.PI / 2)
          ctx.drawImage(tankImg, -tw / 2, -th / 2, tw, th)
          ctx.restore()
        } else {
          ctx.fillStyle = '#166534'
          ctx.fillRect(pos.x - tw / 2, pos.y - th / 2, tw, th)
        }
        // label bubble
        ctx.fillStyle = 'white'
        ctx.strokeStyle = '#1E1B4B'
        ctx.lineWidth = 3 * dpr
        ctx.beginPath(); ctx.arc(pos.x, pos.y - 60 * dpr, 28 * dpr, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
        ctx.fillStyle = '#1E1B4B'
        ctx.font = `bold ${22 * dpr}px Fredoka, sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(pos.label, pos.x, pos.y - 58 * dpr)
      }

      // cannon base
      ctx.fillStyle = '#1F2937'
      ctx.beginPath(); ctx.arc(cannonX, cannonY, 22 * dpr, 0, Math.PI * 2); ctx.fill()
      // barrel
      const rad = (-angle * Math.PI) / 180
      ctx.save(); ctx.translate(cannonX, cannonY); ctx.rotate(rad)
      ctx.fillStyle = '#374151'
      ctx.fillRect(0, -8 * dpr, 50 * dpr, 16 * dpr)
      ctx.restore()

      // aim guide dots (when not firing)
      if (!firing) {
        const v0 = power * 0.18 * dpr
        const vx = Math.cos(rad) * v0
        const vy = Math.sin(rad) * v0
        const g = 0.45 * dpr
        ctx.fillStyle = 'rgba(31,41,55,0.5)'
        for (let t = 4; t < 60; t += 4) {
          const x = cannonX + vx * t
          const y = cannonY + vy * t + 0.5 * g * t * t
          if (y > groundY || x > W) break
          ctx.beginPath(); ctx.arc(x, y, 3 * dpr, 0, Math.PI * 2); ctx.fill()
        }
      }

      // projectile
      const p = projRef.current
      if (p.alive) {
        p.x += p.vx * (dt / 16)
        p.y += p.vy * (dt / 16)
        p.vy += 0.45 * dpr * (dt / 16)
        const bImg = sprites.current['tanks/bullet.png']
        if (bImg.complete && bImg.naturalWidth) ctx.drawImage(bImg, p.x - 10 * dpr, p.y - 10 * dpr, 20 * dpr, 20 * dpr)
        else { ctx.fillStyle = '#1F2937'; ctx.beginPath(); ctx.arc(p.x, p.y, 8 * dpr, 0, Math.PI * 2); ctx.fill() }

        // check collisions
        for (const pos of optionPositionsRef.current) {
          if (Math.hypot(p.x - pos.x, p.y - pos.y) < pos.r) {
            p.alive = false
            expRef.current = { x: pos.x, y: pos.y, t: 0 }
            const correct = pos.label === q.answer
            setResolved(correct ? 'correct' : 'wrong')
            if (correct) { playCorrect(); onCorrect() } else { playWrong(); onWrong() }
            setTimeout(() => {
              if (index + 1 >= questions.length) onComplete()
              else { setIndex(i => i + 1); setResolved(null); setFiring(false) }
            }, 1400)
            break
          }
        }
        // off-screen / ground
        if (p.alive && (p.y > groundY || p.x > W || p.x < 0)) {
          p.alive = false
          setResolved('wrong')
          playWrong(); onWrong()
          setTimeout(() => {
            if (index + 1 >= questions.length) onComplete()
            else { setIndex(i => i + 1); setResolved(null); setFiring(false) }
          }, 1400)
        }
      }

      // explosion
      if (expRef.current) {
        expRef.current.t += dt
        const t = expRef.current.t
        const r = (t / 4) * dpr
        ctx.fillStyle = `rgba(239,68,68,${Math.max(0, 1 - t / 500)})`
        ctx.beginPath(); ctx.arc(expRef.current.x, expRef.current.y, r, 0, Math.PI * 2); ctx.fill()
        if (t > 500) expRef.current = null
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [index, angle, power, firing, questions])

  const fire = () => {
    if (firing || resolved) return
    const cvs = canvasRef.current!
    const dpr = window.devicePixelRatio || 1
    const W = cvs.width
    const H = cvs.height
    void W
    const cannonX = 60 * dpr
    const cannonY = H - 50 * dpr
    const rad = (-angle * Math.PI) / 180
    const v0 = power * 0.18 * dpr
    projRef.current = { x: cannonX + Math.cos(rad) * 50 * dpr, y: cannonY + Math.sin(rad) * 50 * dpr, vx: Math.cos(rad) * v0, vy: Math.sin(rad) * v0, alive: true }
    setFiring(true)
  }

  if (showInstructions) {
    return (
      <div className="clay-card p-6 max-w-md mx-auto text-center space-y-4">
        <div className="text-6xl">💣</div>
        <h2 className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Cannon Blast</h2>
        <div className="text-clay-text-muted text-base font-semibold space-y-2 text-left">
          <p>🎯 Read the sentence. Two tanks show the answer options.</p>
          <p>🔧 Set angle + power, then <b>FIRE!</b></p>
          <p>💥 Hit the tank with the <b>correct</b> answer to win the round.</p>
        </div>
        <button onClick={() => setShowInstructions(false)} className="clay-button px-8 py-4 text-xl font-extrabold w-full" style={{ fontFamily: 'var(--font-display)' }}>
          ⚔️ To Battle!
        </button>
      </div>
    )
  }

  if (!questions[index]) return <div className="text-clay-text font-bold p-8">Need more words.</div>
  const q = questions[index]

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3">
      <div className="clay-card px-4 py-3 text-center">
        <p className="text-sm text-clay-text-muted font-bold mb-1">Round {index + 1}/{questions.length} — Hit the correct tank!</p>
        <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>{q.sentence}</p>
      </div>

      <canvas ref={canvasRef} className="w-full rounded-2xl border-4 border-white shadow-clay-card" style={{ aspectRatio: '5 / 3', maxHeight: '50vh', touchAction: 'none' }} />

      <div className="clay-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-extrabold text-clay-text w-20">Angle: {angle}°</label>
          <input type="range" min={10} max={80} value={angle} onChange={(e) => setAngle(+e.target.value)} disabled={firing} className="flex-1" />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-extrabold text-clay-text w-20">Power: {power}</label>
          <input type="range" min={40} max={100} value={power} onChange={(e) => setPower(+e.target.value)} disabled={firing} className="flex-1" />
        </div>
        <button onClick={fire} disabled={firing || !!resolved} className="clay-button w-full py-3 text-xl font-extrabold disabled:opacity-50" style={{ fontFamily: 'var(--font-display)' }}>
          {resolved === 'correct' ? '💥 HIT!' : resolved === 'wrong' ? '❌ MISS' : '🔥 FIRE!'}
        </button>
      </div>
    </div>
  )
}
