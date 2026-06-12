import { useEffect, useRef, useState } from 'react'
import { playCorrect, playWrong, playClick, speak } from '../hooks/useSound'
import { Volume2, Crosshair } from 'lucide-react'
import { makeRounds, ASSET, type Round } from './shared/wordBank'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

const MAX_ROUNDS = 10
const UFO_SPRITES = ['ufoBlue.png', 'ufoGreen.png', 'ufoRed.png', 'ufoYellow.png']

type Ufo = { word: string; x: number; y: number; vx: number; bob: number; sprite: number; dead: boolean; flash: number }
type Laser = { x: number; y: number; tx: number; ty: number; t: number; word: string }
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string }

export default function TargetBlast({ words, onCorrect, onWrong, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [started, setStarted] = useState(false)
  const [roundIdx, setRoundIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const roundsRef = useRef<Round[]>([])
  if (roundsRef.current.length === 0) roundsRef.current = makeRounds(words, MAX_ROUNDS, 4)
  const stateRef = useRef({ ufos: [] as Ufo[], lasers: [] as Laser[], sparks: [] as Spark[], locked: false, cannonX: 0 })
  const scoreRef = useRef(0)

  const round = roundsRef.current[roundIdx]

  useEffect(() => {
    if (!started || done) return
    const r = roundsRef.current[roundIdx]
    if (r) {
      speak(r.word)
      // place one UFO per option, spread across the sky
      const lanes = r.options.length
      stateRef.current.ufos = r.options.map((word, i) => ({
        word,
        x: 0.15 + (0.7 / Math.max(1, lanes - 1)) * i,
        y: 0.16 + (i % 2) * 0.17 + Math.random() * 0.06,
        vx: (Math.random() > 0.5 ? 1 : -1) * (0.00035 + Math.random() * 0.0005),
        bob: Math.random() * Math.PI * 2,
        sprite: i % UFO_SPRITES.length,
        dead: false,
        flash: 0,
      }))
      stateRef.current.locked = false
    }
  }, [started, roundIdx, done])

  useEffect(() => {
    if (!started) return
    setRoundIdx(0); setScore(0); scoreRef.current = 0; setDone(false)

    const cvs = canvasRef.current!
    const ctx = cvs.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const W = (cvs.width = cvs.clientWidth * dpr)
    const H = (cvs.height = cvs.clientHeight * dpr)
    stateRef.current.cannonX = W / 2

    const sprites: Record<string, HTMLImageElement> = {}
    const load = (p: string) => { const img = new Image(); img.src = ASSET(`assets/${p}`); sprites[p] = img }
    UFO_SPRITES.forEach(s => load(`ufo/${s}`))
    load('bg/space-blue.png')
    load('missiles/laser.png')
    load('ships/player.png')

    const stars = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.4, tw: Math.random() * Math.PI * 2 }))
    let bgY = 0
    let raf = 0
    let last = performance.now()

    const fireAt = (ufo: Ufo) => {
      const st = stateRef.current
      if (st.locked) return
      st.locked = true
      playClick()
      st.lasers.push({ x: st.cannonX, y: H - 60 * dpr, tx: ufo.x * W, ty: ufo.y * H, t: 0, word: ufo.word })
    }

    const onPointer = (e: PointerEvent) => {
      const r = cvs.getBoundingClientRect()
      const px = ((e.clientX - r.left) / r.width) * W
      const py = ((e.clientY - r.top) / r.height) * H
      const st = stateRef.current
      const hit = st.ufos.find(u => !u.dead && Math.abs(u.x * W - px) < 55 * dpr && Math.abs(u.y * H - py) < 55 * dpr)
      if (hit) fireAt(hit)
    }
    cvs.addEventListener('pointerdown', onPointer)

    const resolveHit = (laser: Laser) => {
      const st = stateRef.current
      const cur = roundsRef.current[stateRefRound.current]
      const ufo = st.ufos.find(u => u.word === laser.word)
      if (!cur || !ufo) { st.locked = false; return }
      if (laser.word === cur.word) {
        playCorrect(); onCorrect()
        scoreRef.current += 1
        setScore(scoreRef.current)
        ufo.dead = true
        for (let i = 0; i < 26; i++) {
          st.sparks.push({
            x: ufo.x * W, y: ufo.y * H,
            vx: (Math.random() - 0.5) * 9 * dpr, vy: (Math.random() - 0.5) * 9 * dpr,
            life: 1, color: ['#FECA57', '#FF6B6B', '#48DBFB', '#1DD1A1'][i % 4],
          })
        }
        setTimeout(nextRound, 900)
      } else {
        playWrong(); onWrong()
        ufo.flash = 1
        const right = st.ufos.find(u => u.word === cur.word)
        if (right) right.flash = -1 // green highlight to teach the answer
        setTimeout(nextRound, 1400)
      }
    }

    // track round index inside the RAF closure
    const stateRefRound = { current: 0 }
    const nextRound = () => {
      stateRefRound.current += 1
      if (stateRefRound.current >= MAX_ROUNDS) {
        setDone(true)
        setTimeout(onComplete, 1800)
      } else {
        setRoundIdx(stateRefRound.current)
      }
    }

    const draw = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now
      const st = stateRef.current

      // scrolling space background
      const bg = sprites['bg/space-blue.png']
      bgY = (bgY + dt * 0.01 * dpr) % (256 * dpr)
      if (bg.complete && bg.naturalWidth) {
        for (let y = -256 * dpr + bgY; y < H; y += 256 * dpr)
          for (let x = 0; x < W; x += 256 * dpr)
            ctx.drawImage(bg, x, y, 256 * dpr, 256 * dpr)
      } else { ctx.fillStyle = '#0b1026'; ctx.fillRect(0, 0, W, H) }
      for (const s of stars) {
        s.tw += dt * 0.004
        ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(s.tw)})`
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * dpr, 0, Math.PI * 2); ctx.fill()
      }

      // UFOs with word tags
      for (const u of st.ufos) {
        if (u.dead) continue
        u.bob += dt * 0.003
        u.x += u.vx * dt
        if (u.x < 0.12 || u.x > 0.88) u.vx *= -1
        const ux = u.x * W
        const uy = u.y * H + Math.sin(u.bob) * 8 * dpr
        const size = 74 * dpr
        const img = sprites[`ufo/${UFO_SPRITES[u.sprite]}`]
        ctx.save()
        if (u.flash > 0) { ctx.filter = 'grayscale(1) brightness(1.6)'; u.flash = Math.max(0, u.flash - dt * 0.002) }
        if (img.complete && img.naturalWidth) ctx.drawImage(img, ux - size / 2, uy - size / 2, size, size)
        else { ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(ux, uy, size / 2, 0, Math.PI * 2); ctx.fill() }
        ctx.restore()
        // word pill
        ctx.font = `bold ${17 * dpr}px Fredoka, sans-serif`
        const tw = ctx.measureText(u.word).width
        const pw = tw + 22 * dpr
        const py = uy + size / 2 + 4 * dpr
        ctx.fillStyle = u.flash === -1 ? '#1DD1A1' : 'rgba(255,255,255,0.95)'
        ctx.beginPath(); ctx.roundRect(ux - pw / 2, py, pw, 28 * dpr, 14 * dpr); ctx.fill()
        ctx.fillStyle = u.flash === -1 ? '#fff' : '#1E1B4B'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(u.word, ux, py + 14 * dpr)
      }

      // cannon ship at bottom
      const ship = sprites['ships/player.png']
      const shipW = 64 * dpr
      if (ship.complete && ship.naturalWidth) {
        ctx.save(); ctx.translate(st.cannonX, H - 40 * dpr); ctx.rotate(Math.PI)
        ctx.drawImage(ship, -shipW / 2, -shipW / 2, shipW, shipW)
        ctx.restore()
      }

      // lasers fly toward target
      for (const l of st.lasers) {
        l.t = Math.min(1, l.t + dt * 0.004)
        const lx = l.x + (l.tx - l.x) * l.t
        const ly = l.y + (l.ty - l.y) * l.t
        const limg = sprites['missiles/laser.png']
        const ang = Math.atan2(l.ty - l.y, l.tx - l.x) + Math.PI / 2
        ctx.save(); ctx.translate(lx, ly); ctx.rotate(ang)
        if (limg.complete && limg.naturalWidth) ctx.drawImage(limg, -7 * dpr, -16 * dpr, 14 * dpr, 32 * dpr)
        else { ctx.fillStyle = '#FECA57'; ctx.fillRect(-3 * dpr, -12 * dpr, 6 * dpr, 24 * dpr) }
        ctx.restore()
        if (l.t >= 1) resolveHit(l)
      }
      st.lasers = st.lasers.filter(l => l.t < 1)

      // sparks
      for (const sp of st.sparks) {
        sp.x += sp.vx; sp.y += sp.vy; sp.vy += 0.12 * dpr; sp.life -= dt * 0.0016
        ctx.fillStyle = sp.color
        ctx.globalAlpha = Math.max(0, sp.life)
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 4 * dpr * sp.life, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1
      }
      st.sparks = st.sparks.filter(sp => sp.life > 0)

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
        <div className="text-6xl">🛸</div>
        <h2 className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>UFO Blast</h2>
        <div className="text-clay-text-muted text-base font-semibold space-y-2 text-left">
          <p>👂 Listen to the word and look at the picture!</p>
          <p>🛸 Find the UFO carrying that word.</p>
          <p>💥 Tap it to blast it out of the sky!</p>
          <p>🏆 {MAX_ROUNDS} UFOs to blast!</p>
        </div>
        <button onClick={() => setStarted(true)} className="clay-button px-8 py-4 text-xl font-extrabold w-full" style={{ fontFamily: 'var(--font-display)' }}>
          🔫 Start Mission!
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3">
      <div className="clay-card px-4 py-2 w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          <Crosshair className="w-5 h-5 text-clay-cta" strokeWidth={2.5} /> {score}
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
        <span className="text-clay-text-muted font-bold text-sm">{Math.min(roundIdx + 1, MAX_ROUNDS)}/{MAX_ROUNDS}</span>
      </div>
      <canvas ref={canvasRef} className="w-full rounded-2xl border-4 border-white shadow-clay-card"
        style={{ aspectRatio: '4 / 3', maxHeight: '62vh', background: '#0b1026', touchAction: 'none' }} />
      {done ? (
        <div className="clay-card p-5 text-center animate-pop-in space-y-2">
          <div className="text-5xl">{score >= MAX_ROUNDS * 0.7 ? '🏆' : '💪'}</div>
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
            {score >= MAX_ROUNDS * 0.7 ? 'Sharpshooter!' : 'Good flying!'}
          </p>
          <p className="text-clay-text-muted font-bold">UFOs blasted: {score}/{MAX_ROUNDS}</p>
        </div>
      ) : (
        <p className="text-clay-text-muted text-base font-semibold">🛸 Tap the UFO carrying the word you hear!</p>
      )}
    </div>
  )
}
