import { useEffect, useRef, useState } from 'react'
import { playCorrect, playWrong, playClick, playLevelUp, speak } from '../hooks/useSound'
import { Volume2, Fuel } from 'lucide-react'
import { makeRounds, ASSET, type Round } from './shared/wordBank'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

const MAX_FUEL = 8
const FIRE_FRAMES = ['fire00.png', 'fire04.png', 'fire08.png', 'fire12.png', 'fire16.png']
const PILLS = ['pill_blue.png', 'pill_green.png', 'pill_red.png', 'pill_yellow.png']

export default function RocketLaunch({ words, onCorrect, onWrong, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [started, setStarted] = useState(false)
  const [roundIdx, setRoundIdx] = useState(0)
  const [fuel, setFuel] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [phase, setPhase] = useState<'fuel' | 'countdown' | 'launch' | 'done'>('fuel')
  const roundsRef = useRef<Round[]>([])
  if (roundsRef.current.length === 0) roundsRef.current = makeRounds(words, MAX_FUEL * 3, 4)
  const animRef = useRef({ fuel: 0, phase: 'fuel' as 'fuel' | 'countdown' | 'launch' | 'done', countT: 0, launchT: 0, steam: 0 })

  const round = roundsRef.current.length ? roundsRef.current[roundIdx % roundsRef.current.length] : undefined

  useEffect(() => {
    if (!started) return
    if (round && animRef.current.phase === 'fuel') speak(round.word)
  }, [started, roundIdx])

  useEffect(() => {
    if (!started) return
    setRoundIdx(0); setFuel(0); setPhase('fuel'); setAnswered(false); setChosen(null)
    animRef.current = { fuel: 0, phase: 'fuel', countT: 0, launchT: 0, steam: 0 }

    const cvs = canvasRef.current!
    const ctx = cvs.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const W = (cvs.width = cvs.clientWidth * dpr)
    const H = (cvs.height = cvs.clientHeight * dpr)

    const sprites: Record<string, HTMLImageElement> = {}
    const load = (p: string) => { const img = new Image(); img.src = ASSET(`assets/${p}`); sprites[p] = img }
    load('rockets/rocket.png')
    load('bg/space-purple.png')
    FIRE_FRAMES.forEach(f => load(`fx/${f}`))

    const stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.8, r: Math.random() * 1.5 + 0.4, tw: Math.random() * Math.PI * 2 }))
    type Puff = { x: number; y: number; r: number; life: number }
    const puffs: Puff[] = []
    let raf = 0
    let last = performance.now()

    const rocketW = 56 * dpr
    const rocketH = rocketW * (748 / 244)
    const padY = H * 0.86

    const draw = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now
      const a = animRef.current

      // night sky
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#1E1B4B'); sky.addColorStop(0.7, '#312E81'); sky.addColorStop(1, '#4C1D95')
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
      for (const s of stars) {
        s.tw += dt * 0.003
        ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.4 * Math.sin(s.tw)})`
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * dpr, 0, Math.PI * 2); ctx.fill()
      }
      // moon (the destination)
      ctx.fillStyle = '#FDE68A'
      ctx.beginPath(); ctx.arc(W * 0.82, H * 0.12, 30 * dpr, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = 'rgba(217,180,80,0.45)'
      ctx.beginPath(); ctx.arc(W * 0.80, H * 0.10, 7 * dpr, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(W * 0.85, H * 0.15, 5 * dpr, 0, Math.PI * 2); ctx.fill()

      // ground + pad
      ctx.fillStyle = '#374151'; ctx.fillRect(0, padY + rocketH * 0.02, W, H)
      ctx.fillStyle = '#6B7280'
      ctx.fillRect(W * 0.5 - 70 * dpr, padY, 140 * dpr, 10 * dpr)
      // gantry tower
      ctx.strokeStyle = '#9CA3AF'; ctx.lineWidth = 4 * dpr
      const gx = W * 0.5 - 70 * dpr
      ctx.beginPath()
      ctx.moveTo(gx, padY); ctx.lineTo(gx, padY - rocketH * 0.95)
      for (let i = 1; i <= 5; i++) {
        const yy = padY - (rocketH * 0.95 / 5) * i
        ctx.moveTo(gx, yy); ctx.lineTo(gx + 28 * dpr, yy + 14 * dpr)
      }
      ctx.stroke()

      // rocket position
      let ry = padY
      let shake = 0
      if (a.phase === 'countdown') {
        a.countT += dt
        shake = 1.5 * dpr
        if (a.countT > 3000) { a.phase = 'launch'; setPhase('launch'); playLevelUp() }
      } else if (a.phase === 'launch') {
        a.launchT += dt
        const t = a.launchT / 2600
        ry = padY - (H * 0.95 + rocketH) * t * t
        shake = 3 * dpr
        if (t >= 1 && a.phase === 'launch') {
          a.phase = 'done'
          setPhase('done')
          setTimeout(onComplete, 1800)
        }
      } else if (a.phase === 'fuel') {
        shake = a.fuel >= MAX_FUEL - 2 ? 0.8 * dpr : 0
      }
      const rx = W * 0.5 + (shake ? (Math.random() - 0.5) * shake * 2 : 0)

      // exhaust fire when launching / late fueling
      if (a.phase === 'launch' || a.phase === 'countdown') {
        const fimg = sprites[`fx/${FIRE_FRAMES[Math.floor(now / 70) % FIRE_FRAMES.length]}`]
        const fw = 26 * dpr, fh = 60 * dpr * (a.phase === 'launch' ? 1.4 : 0.7)
        if (fimg.complete && fimg.naturalWidth) ctx.drawImage(fimg, rx - fw / 2, ry - 4 * dpr, fw, fh)
        if (Math.random() < 0.5) puffs.push({ x: rx + (Math.random() - 0.5) * 30 * dpr, y: Math.min(ry + 50 * dpr, padY + 6 * dpr), r: (6 + Math.random() * 8) * dpr, life: 1 })
      }
      // steam puff when fuel added
      if (a.steam > 0) {
        a.steam -= dt
        if (Math.random() < 0.6) puffs.push({ x: rx - 34 * dpr, y: padY - 18 * dpr, r: (4 + Math.random() * 6) * dpr, life: 1 })
      }
      for (const p of puffs) {
        p.life -= dt * 0.0012; p.y -= dt * 0.01 * dpr; p.r += dt * 0.01 * dpr
        ctx.fillStyle = `rgba(229,231,235,${Math.max(0, p.life) * 0.7})`
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
      }
      for (let i = puffs.length - 1; i >= 0; i--) if (puffs[i].life <= 0) puffs.splice(i, 1)

      // rocket sprite (anchor: bottom center)
      const rimg = sprites['rockets/rocket.png']
      if (rimg.complete && rimg.naturalWidth) ctx.drawImage(rimg, rx - rocketW / 2, ry - rocketH, rocketW, rocketH)
      else { ctx.fillStyle = '#E5E7EB'; ctx.fillRect(rx - rocketW / 2, ry - rocketH, rocketW, rocketH) }

      // fuel gauge
      const gW = 18 * dpr, gH = H * 0.4, gX = 18 * dpr, gY = H * 0.3
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.beginPath(); ctx.roundRect(gX, gY, gW, gH, 9 * dpr); ctx.fill()
      const frac = a.fuel / MAX_FUEL
      const fillH = gH * frac
      const grad = ctx.createLinearGradient(0, gY + gH - fillH, 0, gY + gH)
      grad.addColorStop(0, '#FB923C'); grad.addColorStop(1, '#EF4444')
      ctx.fillStyle = grad
      ctx.beginPath(); ctx.roundRect(gX, gY + gH - fillH, gW, fillH, 9 * dpr); ctx.fill()
      ctx.font = `bold ${14 * dpr}px Fredoka, sans-serif`
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'
      ctx.fillText('FUEL', gX + gW / 2, gY - 10 * dpr)

      // countdown number
      if (a.phase === 'countdown') {
        const n = 3 - Math.floor(a.countT / 1000)
        ctx.font = `bold ${90 * dpr}px Fredoka, sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(String(Math.max(1, n)), W / 2, H * 0.3)
      }
      if (a.phase === 'done') {
        ctx.font = `bold ${34 * dpr}px Fredoka, sans-serif`
        ctx.fillStyle = '#FDE68A'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('🌙 To the Moon!', W / 2, H * 0.4)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [started])

  const handleAnswer = (opt: string) => {
    if (answered || phase !== 'fuel' || !round) return
    setChosen(opt); setAnswered(true)
    if (opt === round.word) {
      playCorrect(); onCorrect()
      const newFuel = fuel + 1
      animRef.current.fuel = newFuel
      animRef.current.steam = 700
      setFuel(newFuel)
      setTimeout(() => {
        setAnswered(false); setChosen(null)
        if (newFuel >= MAX_FUEL) {
          animRef.current.phase = 'countdown'
          setPhase('countdown')
          playClick()
        } else setRoundIdx(i => i + 1)
      }, 700)
    } else {
      playWrong(); onWrong()
      setTimeout(() => { setAnswered(false); setChosen(null); setRoundIdx(i => i + 1) }, 1300)
    }
  }

  if (!started) {
    return (
      <div className="clay-card p-6 max-w-md mx-auto text-center space-y-4">
        <div className="text-6xl">🚀</div>
        <h2 className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Mission Blast Off</h2>
        <div className="text-clay-text-muted text-base font-semibold space-y-2 text-left">
          <p>👂 Listen to the word and look at the picture!</p>
          <p>⛽ Tap the fuel cell with that word to pump fuel.</p>
          <p>🔥 Fill the tank ({MAX_FUEL} cells) to launch!</p>
          <p>🌙 Fly your rocket all the way to the moon!</p>
        </div>
        <button onClick={() => setStarted(true)} className="clay-button px-8 py-4 text-xl font-extrabold w-full" style={{ fontFamily: 'var(--font-display)' }}>
          🚀 Begin Mission!
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3">
      <div className="clay-card px-4 py-2 w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          <Fuel className="w-5 h-5 text-clay-cta" strokeWidth={2.5} /> {fuel}/{MAX_FUEL}
        </div>
        {round && phase === 'fuel' && (
          <div className="flex items-center gap-3">
            <span className="text-4xl">{round.emoji ?? '❔'}</span>
            <button onClick={() => speak(round.word)}
              className="clay-card-interactive flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-clay-text border-3 border-white/80"
              style={{ fontFamily: 'var(--font-display)' }}>
              <Volume2 className="w-6 h-6 text-clay-primary" strokeWidth={2.5} /> Hear it
            </button>
          </div>
        )}
        {phase !== 'fuel' && <span className="font-extrabold text-clay-cta" style={{ fontFamily: 'var(--font-display)' }}>
          {phase === 'countdown' ? '🔥 IGNITION!' : phase === 'launch' ? '🚀 LIFT OFF!' : '🌙 Mission Complete!'}
        </span>}
      </div>
      <canvas ref={canvasRef} className="w-full rounded-2xl border-4 border-white shadow-clay-card"
        style={{ aspectRatio: '4 / 3', maxHeight: '56vh', background: '#1E1B4B', touchAction: 'none' }} />
      {phase === 'fuel' && round && (
        <div className="grid grid-cols-2 gap-2 w-full">
          {round.options.map((opt, i) => {
            const isRight = opt === round.word
            let cls = 'min-h-[52px] rounded-2xl text-lg font-extrabold transition-all duration-200 border-3 flex items-center justify-center gap-2'
            if (answered) {
              if (isRight) cls += ' clay-card border-clay-success/30 animate-pop-in'
              else if (chosen === opt) cls += ' bg-clay-error/20 text-clay-error animate-wiggle border-clay-error/30'
              else cls += ' bg-white/30 opacity-40 border-white/20'
            } else cls += ' clay-card-interactive border-white/80 text-clay-text'
            return (
              <button key={`${roundIdx}-${i}`} onClick={() => handleAnswer(opt)} disabled={answered} className={cls} style={{ fontFamily: 'var(--font-display)' }}>
                <img src={ASSET(`assets/powerups/${PILLS[i % PILLS.length]}`)} alt="" className="w-6 h-6" />
                {opt}
              </button>
            )
          })}
        </div>
      )}
      {phase === 'done' && (
        <div className="clay-card p-5 text-center animate-pop-in space-y-2">
          <div className="text-5xl">🌙</div>
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>We reached the Moon!</p>
        </div>
      )}
    </div>
  )
}
