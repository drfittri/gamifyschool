import { useEffect, useRef, useState } from 'react'
import { playCorrect, playWrong, playClick, speak } from '../hooks/useSound'
import { Volume2, Medal } from 'lucide-react'
import { makeRounds, ASSET, type Round } from './shared/wordBank'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

const MAX_RECRUITS = 10
const RANKS = ['Private', 'Corporal', 'Sergeant', 'Lieutenant', 'Captain', 'General']
const TANK_SPRITES = ['blue.png', 'green.png', 'desert.png', 'grey.png']

type Tank = {
  word: string; sprite: number
  x: number; y: number           // current position (fraction of canvas)
  tx: number; ty: number         // target position
  driving: boolean; recruited: boolean; shake: number; highlight: boolean
}
type Dust = { x: number; y: number; r: number; life: number }

export default function TroopMarch({ words, onCorrect, onWrong, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [started, setStarted] = useState(false)
  const [roundIdx, setRoundIdx] = useState(0)
  const [recruits, setRecruits] = useState(0)
  const [done, setDone] = useState(false)
  const roundsRef = useRef<Round[]>([])
  if (roundsRef.current.length === 0) roundsRef.current = makeRounds(words, MAX_RECRUITS * 3, 4)
  const stateRef = useRef({ tanks: [] as Tank[], army: [] as Tank[], dust: [] as Dust[], locked: false })
  const recruitsRef = useRef(0)

  const round = roundsRef.current[roundIdx]
  const rank = RANKS[Math.min(Math.floor(recruits / 2), RANKS.length - 1)]

  useEffect(() => {
    if (!started || done) return
    const r = roundsRef.current[roundIdx]
    if (r) {
      speak(r.word)
      // 2x2 grid of candidate tanks on the left field
      stateRef.current.tanks = r.options.map((word, i) => ({
        word, sprite: i % TANK_SPRITES.length,
        x: 0.16 + (i % 2) * 0.26, y: 0.30 + Math.floor(i / 2) * 0.30,
        tx: 0, ty: 0, driving: false, recruited: false, shake: 0, highlight: false,
      }))
      stateRef.current.locked = false
    }
  }, [started, roundIdx, done])

  useEffect(() => {
    if (!started) return
    setRoundIdx(0); setRecruits(0); recruitsRef.current = 0; setDone(false)
    stateRef.current.army = []

    const cvs = canvasRef.current!
    const ctx = cvs.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const W = (cvs.width = cvs.clientWidth * dpr)
    const H = (cvs.height = cvs.clientHeight * dpr)

    const sprites: Record<string, HTMLImageElement> = {}
    const load = (p: string) => { const img = new Image(); img.src = ASSET(`assets/${p}`); sprites[p] = img }
    TANK_SPRITES.forEach(s => load(`tanks/${s}`))
    load('soldiers/astro1.png'); load('soldiers/astro2.png'); load('soldiers/astro3.png')

    const clouds = Array.from({ length: 4 }, (_, i) => ({ x: Math.random() * W, y: (0.05 + i * 0.04) * H, v: (0.005 + Math.random() * 0.01) * dpr, s: (0.6 + Math.random() * 0.7) }))
    let raf = 0
    let last = performance.now()
    const roundRef = { current: 0 }

    const armySlot = (n: number) => ({
      x: 0.92 - (n % 3) * 0.075,
      y: 0.38 + Math.floor(n / 3) * 0.16,
    })

    const nextRound = () => {
      roundRef.current += 1
      if (roundRef.current >= roundsRef.current.length) roundsRef.current.push(...makeRounds(words, 5, 4))
      setRoundIdx(roundRef.current)
    }

    const onPointer = (e: PointerEvent) => {
      const st = stateRef.current
      if (st.locked) return
      const r = cvs.getBoundingClientRect()
      const px = ((e.clientX - r.left) / r.width) * W
      const py = ((e.clientY - r.top) / r.height) * H
      const hit = st.tanks.find(t => !t.recruited && Math.abs(t.x * W - px) < 62 * dpr && Math.abs(t.y * H - py) < 55 * dpr)
      if (!hit) return
      st.locked = true
      const cur = roundsRef.current[roundRef.current]
      if (hit.word === cur.word) {
        playCorrect(); onCorrect(); playClick()
        recruitsRef.current += 1
        setRecruits(recruitsRef.current)
        hit.recruited = true
        hit.driving = true
        const slot = armySlot(recruitsRef.current - 1)
        hit.tx = slot.x; hit.ty = slot.y
        st.army.push(hit)
        setTimeout(() => {
          if (recruitsRef.current >= MAX_RECRUITS) {
            setDone(true)
            setTimeout(onComplete, 2000)
          } else nextRound()
        }, 1100)
      } else {
        playWrong(); onWrong()
        hit.shake = 1
        const right = st.tanks.find(t => t.word === cur.word)
        if (right) right.highlight = true
        setTimeout(nextRound, 1500)
      }
    }
    cvs.addEventListener('pointerdown', onPointer)

    const drawTank = (t: Tank, scale = 1) => {
      const img = sprites[`tanks/${TANK_SPRITES[t.sprite]}`]
      const tw = 78 * dpr * scale, th = 62 * dpr * scale
      const sx = t.shake > 0 ? Math.sin(t.shake * 40) * 5 * dpr * t.shake : 0
      ctx.save()
      ctx.translate(t.x * W + sx, t.y * H)
      ctx.rotate(Math.PI / 2) // sprite faces up; point it right
      if (img.complete && img.naturalWidth) ctx.drawImage(img, -tw / 2, -th / 2, tw, th)
      else { ctx.fillStyle = '#4B5563'; ctx.fillRect(-tw / 2, -th / 2, tw, th) }
      ctx.restore()
    }

    const draw = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now
      const st = stateRef.current

      // sky, sun, clouds
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.7)
      sky.addColorStop(0, '#7DD3FC'); sky.addColorStop(1, '#E0F2FE')
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.7)
      ctx.fillStyle = '#FDE047'
      ctx.beginPath(); ctx.arc(W * 0.08, H * 0.1, 26 * dpr, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      for (const c of clouds) {
        c.x = (c.x + c.v * dt) % (W + 100 * dpr)
        ctx.beginPath()
        ctx.ellipse(c.x, c.y, 38 * dpr * c.s, 14 * dpr * c.s, 0, 0, Math.PI * 2)
        ctx.ellipse(c.x + 24 * dpr * c.s, c.y - 8 * dpr * c.s, 26 * dpr * c.s, 12 * dpr * c.s, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      // hills + ground
      ctx.fillStyle = '#86EFAC'
      ctx.beginPath(); ctx.ellipse(W * 0.25, H * 0.72, W * 0.45, H * 0.13, 0, Math.PI, 0); ctx.fill()
      ctx.beginPath(); ctx.ellipse(W * 0.8, H * 0.74, W * 0.4, H * 0.16, 0, Math.PI, 0); ctx.fill()
      ctx.fillStyle = '#4ADE80'; ctx.fillRect(0, H * 0.72, W, H * 0.28)
      ctx.fillStyle = 'rgba(22,101,52,0.25)'
      for (let i = 0; i < 14; i++) {
        const gx = (i * 0.073 + 0.02) * W, gy = H * (0.75 + (i % 4) * 0.055)
        ctx.fillRect(gx, gy, 8 * dpr, 2.5 * dpr)
      }

      // HQ base: flag + camp
      const fx = W * 0.86, fy = H * 0.12
      ctx.fillStyle = '#92400E'; ctx.fillRect(fx, fy, 4 * dpr, 80 * dpr)
      ctx.fillStyle = '#EF4444'
      ctx.beginPath(); ctx.moveTo(fx + 4 * dpr, fy); ctx.lineTo(fx + 50 * dpr, fy + 12 * dpr); ctx.lineTo(fx + 4 * dpr, fy + 24 * dpr); ctx.fill()
      ctx.fillStyle = '#1E1B4B'
      ctx.font = `bold ${13 * dpr}px Fredoka, sans-serif`; ctx.textAlign = 'center'
      ctx.fillText('HQ', fx + 2 * dpr, fy + 95 * dpr)
      // soldiers guarding HQ (one per 3 recruits)
      const nSold = Math.min(3, Math.floor(recruitsRef.current / 3))
      for (let i = 0; i < nSold; i++) {
        const img = sprites[`soldiers/astro${i + 1}.png`]
        const sw = 30 * dpr, sh = 38 * dpr
        if (img.complete && img.naturalWidth) ctx.drawImage(img, fx - 30 * dpr - i * 26 * dpr, fy + 50 * dpr, sw, sh)
      }

      // dust puffs
      for (const d of st.dust) {
        d.life -= dt * 0.002; d.x -= dt * 0.02 * dpr
        ctx.fillStyle = `rgba(120,113,108,${Math.max(0, d.life) * 0.5})`
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r * (1.6 - d.life), 0, Math.PI * 2); ctx.fill()
      }
      st.dust = st.dust.filter(d => d.life > 0)

      // recruited army formation
      for (const t of st.army) {
        if (t.driving) {
          const dx = t.tx - t.x, dy = t.ty - t.y
          t.x += dx * dt * 0.004; t.y += dy * dt * 0.004
          if (Math.random() < 0.4) st.dust.push({ x: t.x * W - 30 * dpr, y: t.y * H + 14 * dpr, r: 5 * dpr, life: 1 })
          if (Math.abs(dx) < 0.005 && Math.abs(dy) < 0.005) t.driving = false
        }
        drawTank(t, 0.62)
      }

      // candidate tanks with word pills
      for (const t of st.tanks) {
        if (t.recruited) continue
        if (t.shake > 0) t.shake = Math.max(0, t.shake - dt * 0.0015)
        drawTank(t)
        const ux = t.x * W, uy = t.y * H
        ctx.font = `bold ${17 * dpr}px Fredoka, sans-serif`
        const twd = ctx.measureText(t.word).width
        const pw = twd + 22 * dpr
        const py = uy + 42 * dpr
        ctx.fillStyle = t.highlight ? '#1DD1A1' : 'rgba(255,255,255,0.95)'
        ctx.beginPath(); ctx.roundRect(ux - pw / 2, py, pw, 28 * dpr, 14 * dpr); ctx.fill()
        ctx.fillStyle = t.highlight ? '#fff' : '#1E1B4B'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(t.word, ux, py + 14 * dpr)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      cvs.removeEventListener('pointerdown', onPointer)
    }
  }, [started])

  if (!started) {
    return (
      <div className="clay-card p-6 max-w-md mx-auto text-center space-y-4">
        <div className="text-6xl">🪖</div>
        <h2 className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Word Army</h2>
        <div className="text-clay-text-muted text-base font-semibold space-y-2 text-left">
          <p>👂 Listen to the word and look at the picture!</p>
          <p>🪖 Tap the tank carrying that word.</p>
          <p>🚩 It drives to your base and joins your army!</p>
          <p>🎖️ Recruit {MAX_RECRUITS} tanks to become a General!</p>
        </div>
        <button onClick={() => setStarted(true)} className="clay-button px-8 py-4 text-xl font-extrabold w-full" style={{ fontFamily: 'var(--font-display)' }}>
          🪖 Start Recruiting!
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3">
      <div className="clay-card px-4 py-2 w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          <Medal className="w-5 h-5 text-clay-yellow" strokeWidth={2.5} /> {rank}
        </div>
        {round && !done && (
          <div className="flex items-center gap-3">
            <span className="text-4xl">{round.emoji ?? '❔'}</span>
            <button onClick={() => speak(round.word)}
              className="clay-card-interactive flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-clay-text border-3 border-white/80"
              style={{ fontFamily: 'var(--font-display)' }}>
              <Volume2 className="w-6 h-6 text-clay-primary" strokeWidth={2.5} /> Hear it
            </button>
          </div>
        )}
        <span className="text-clay-text-muted font-bold text-sm">{recruits}/{MAX_RECRUITS}</span>
      </div>
      <canvas ref={canvasRef} className="w-full rounded-2xl border-4 border-white shadow-clay-card"
        style={{ aspectRatio: '4 / 3', maxHeight: '62vh', background: '#E0F2FE', touchAction: 'none' }} />
      {done ? (
        <div className="clay-card p-5 text-center animate-pop-in space-y-2">
          <div className="text-5xl">🎖️</div>
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Army Complete, General!</p>
          <p className="text-clay-text-muted font-bold">{MAX_RECRUITS} tanks recruited!</p>
        </div>
      ) : (
        <p className="text-clay-text-muted text-base font-semibold">🪖 Tap the tank carrying the word you hear!</p>
      )}
    </div>
  )
}
