import { useEffect, useRef, useState } from 'react'
import { playCorrect, playWrong, playExplosion, playPowerup, playComboStreak, playFanfare, playMissionSting, playCountdown, playRumble, speak } from '../hooks/useSound'
import { Fuel, Ear, Zap, Moon } from 'lucide-react'
import { makeRounds, ASSET, type Round } from './shared/wordBank'
import { GameHud, MissionBriefing } from './shared/arcade/GameHud'
import { loadSprites, drawSprite, Particles, Shaker, Floaters, comboCallout, drawStarField, makeStarField, drawPlanet } from './shared/arcade/engine'
import type { SpriteBank } from './shared/arcade/engine'
import { qaExpose } from './shared/qa'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

const PHASES = [
  { rounds: 3, options: 3, label: 'PHASE 1', sub: 'Load the fuel cells!' },
  { rounds: 3, options: 4, label: 'PHASE 2', sub: 'Flight systems check!' },
  { rounds: 2, options: 4, label: 'FINAL PHASE', sub: 'Boosters, go go go!' },
]
const MAX_FUEL = PHASES.reduce((s, p) => s + p.rounds, 0)
const W1 = PHASES[0].rounds
const W2 = W1 + PHASES[1].rounds
const TOTAL = MAX_FUEL
const FIRE_FRAMES = ['fire00.png', 'fire04.png', 'fire08.png', 'fire12.png', 'fire16.png']
const PILLS = ['pill_blue.png', 'pill_green.png', 'pill_red.png', 'pill_yellow.png']

type Phase = 'fuel' | 'countdown' | 'launch' | 'land' | 'done'

export default function RocketLaunch({ words, onCorrect, onWrong, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [started, setStarted] = useState(false)
  const [roundIdx, setRoundIdx] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('fuel')
  const [hud, setHud] = useState({ fuel: 0, streak: 0 })
  const roundsRef = useRef<Round[]>([])
  if (roundsRef.current.length === 0) {
    roundsRef.current = [
      ...makeRounds(words, PHASES[0].rounds, PHASES[0].options),
      ...makeRounds(words, PHASES[1].rounds + PHASES[2].rounds, PHASES[1].options),
    ]
  }
  const animRef = useRef({ fuel: 0, phase: 'fuel' as Phase, countT: 0, launchT: 0, landT: 0, alt: 0 })
  const doubleFuelRef = useRef(false)
  const streakRef = useRef(0)
  const fxRef = useRef<{ particles: Particles; shaker: Shaker; floaters: Floaters } | null>(null)
  const round = roundsRef.current.length ? roundsRef.current[Math.min(roundIdx, TOTAL - 1)] : undefined

  const startMission = () => { playMissionSting(); setStarted(true) }

  // Cinematic loop: launchpad → countdown → liftoff → moon landing.
  useEffect(() => {
    if (!started) return
    setHud({ fuel: 0, streak: 0 })
    animRef.current = { fuel: 0, phase: 'fuel', countT: 0, launchT: 0, landT: 0, alt: 0 }
    doubleFuelRef.current = false
    streakRef.current = 0

    const cvs = canvasRef.current!
    const ctx = cvs.getContext('2d')!
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = (cvs.width = cvs.clientWidth * dpr)
    const H = (cvs.height = cvs.clientHeight * dpr)

    const bank: SpriteBank = loadSprites(['rockets/rocket.png', ...FIRE_FRAMES.map(f => `fx/${f}`), 'soldiers/astro1.png'])

    const particles = new Particles()
    const shaker = new Shaker()
    const floaters = new Floaters()
    fxRef.current = { particles, shaker, floaters }
    const stars = makeStarField(W, H, REDUCED_STAR_COUNT)

    let stopRumble: (() => void) | null = null
    let raf = 0
    let last = performance.now()

    const rocketW = 58 * dpr
    const rocketH = rocketW * (748 / 244)
    const padY = H * 0.86
    const baseCy = padY - rocketH * 0.5

    const draw = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now
      const a = animRef.current

      // -------- scene: altitude 0 = launchpad night, 1 = deep space, moon scene at land
      const alt = a.alt
      if (a.phase !== 'land') {
        // sky darkens with altitude
        const sky = ctx.createLinearGradient(0, 0, 0, H)
        sky.addColorStop(0, lerpColor('#1E1B4B', '#020617', alt))
        sky.addColorStop(0.7, lerpColor('#4C1D95', '#0f172a', alt))
        sky.addColorStop(1, lerpColor('#7C3AED', '#1e1b4b', alt))
        ctx.fillStyle = sky
        ctx.fillRect(0, 0, W, H)
        // stars fade in with altitude
        ctx.globalAlpha = 0.25 + alt * 0.75
        drawStarField(ctx, stars, dt, dpr, 0.4 + alt * 2.2)
        ctx.globalAlpha = 1
        drawPlanet(ctx, W * 0.84, H * 0.12 + alt * H * 0.1, (26 + alt * 10) * dpr, '#FDE68A', '#B45309')
        if (alt < 0.5) drawPlanet(ctx, W * 0.12, H * 0.3, 14 * dpr, '#93C5FD', '#1D4ED8', 'rgba(255,255,255,0.5)')

        // ground recedes as the rocket climbs
        const groundY = padY + 12 * dpr - alt * H * 1.6
        if (groundY < H + 200 * dpr) {
          ctx.fillStyle = lerpColor('#374151', '#14532d', alt)
          ctx.fillRect(0, groundY, W, H)
          // pad platform + gantry
          ctx.fillStyle = '#6B7280'
          ctx.fillRect(W * 0.5 - 70 * dpr, groundY - 10 * dpr, 140 * dpr, 10 * dpr)
          ctx.strokeStyle = '#9CA3AF'
          ctx.lineWidth = 4 * dpr
          const gx = W * 0.5 - 70 * dpr
          ctx.beginPath()
          ctx.moveTo(gx, groundY - 10 * dpr)
          ctx.lineTo(gx, groundY - rocketH * 1.05)
          for (let i = 1; i <= 5; i++) {
            const yy = groundY - 10 * dpr - ((rocketH * 1.05) / 5) * i
            ctx.moveTo(gx, yy); ctx.lineTo(gx + 28 * dpr, yy + 14 * dpr)
          }
          ctx.stroke()
          // blinking tower beacon
          const blink = Math.floor(now / 500) % 2 === 0
          ctx.fillStyle = blink ? '#EF4444' : '#7F1D1D'
          ctx.beginPath(); ctx.arc(gx + 2 * dpr, groundY - rocketH * 1.05 - 6 * dpr, 5 * dpr, 0, Math.PI * 2); ctx.fill()
        }
      } else {
        // -------- moon surface scene
        const sky = ctx.createLinearGradient(0, 0, 0, H)
        sky.addColorStop(0, '#020617'); sky.addColorStop(1, '#111c3d')
        ctx.fillStyle = sky
        ctx.fillRect(0, 0, W, H)
        drawStarField(ctx, stars, dt, dpr, 0.3)
        drawPlanet(ctx, W * 0.82, H * 0.16, 26 * dpr, '#60A5FA', '#1D4ED8', 'rgba(255,255,255,0.55)') // Earth!
        const surfaceY = H * 0.74
        const gg = ctx.createLinearGradient(0, surfaceY, 0, H)
        gg.addColorStop(0, '#D1D5DB'); gg.addColorStop(1, '#6B7280')
        ctx.fillStyle = gg
        ctx.beginPath()
        ctx.moveTo(0, surfaceY + 10 * dpr)
        for (let x = 0; x <= W; x += 40 * dpr) ctx.lineTo(x, surfaceY + Math.sin(x / (60 * dpr)) * 6 * dpr)
        ctx.lineTo(W, H); ctx.lineTo(0, H)
        ctx.fill()
        // craters
        ctx.fillStyle = 'rgba(75,85,99,0.4)'
        ctx.beginPath(); ctx.ellipse(W * 0.2, surfaceY + 40 * dpr, 22 * dpr, 7 * dpr, 0, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.ellipse(W * 0.75, surfaceY + 60 * dpr, 30 * dpr, 9 * dpr, 0, 0, Math.PI * 2); ctx.fill()
      }

      // -------- rocket position per phase
      let ry = padY
      let rx = W * 0.5
      if (a.phase === 'countdown') {
        a.countT += dt
        const n = 3 - Math.floor(a.countT / 1000)
        if (a.countT % 1000 < dt) playCountdown()
        shaker.add(0.06)
        if (a.countT > 3000) {
          a.phase = 'launch'
          setPhase('launch')
          floaters.banner('LIFTOFF!', 'To the Moon!')
          stopRumble = playRumble()
        }
        // countdown number
        ctx.font = `900 ${86 * dpr}px Fredoka, sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.strokeStyle = 'rgba(30,27,75,0.8)'; ctx.lineWidth = 8 * dpr
        const label = n >= 1 ? String(n) : 'GO!'
        ctx.strokeText(label, W / 2, H * 0.3)
        ctx.fillText(label, W / 2, H * 0.3)
      } else if (a.phase === 'launch') {
        a.launchT += dt
        const t = Math.min(1, a.launchT / 3400)
        a.alt = t
        ry = baseCy - (H * 1.1 + rocketH) * t * t
        shaker.add(0.18)
        // exhaust
        const fpath = `fx/${FIRE_FRAMES[Math.floor(now / 60) % FIRE_FRAMES.length]}`
        if (bank.ok(fpath)) {
          const fw = 30 * dpr, fh = (54 + Math.sin(now / 90) * 8) * dpr
          ctx.save(); ctx.globalAlpha = 0.95
          ctx.drawImage(bank.img(fpath), rx - fw / 2, ry + rocketH * 0.5 - 4 * dpr, fw, fh)
          ctx.restore()
        }
        if (Math.random() < 0.7) particles.smoke(rx + (Math.random() - 0.5) * 26 * dpr, Math.min(ry + rocketH * 0.55, padY + 8 * dpr), (7 + Math.random() * 8) * dpr, 1100)
        particles.burst(rx, ry + rocketH * 0.5, { count: 2, colors: ['#F97316', '#FECA57'], speed: 4, size: 4, angle: Math.PI / 2, spread: 0.9, life: 420, grav: 0.05 })
        if (t >= 1) {
          a.phase = 'land'
          a.landT = 0
          a.alt = 1
          setPhase('land')
          floaters.banner('MOON APPROACH!', 'Bring her down gently…')
          stopRumble?.()
        }
      } else if (a.phase === 'land') {
        a.landT += dt
        const t = Math.min(1, a.landT / 2600)
        // descend onto the moon surface
        const surfaceY = H * 0.74
        ry = -rocketH * 0.6 + (surfaceY - rocketH * 0.55 - (-rocketH * 0.6)) * easeOut(t)
        rx = W * 0.42
        const fpath = `fx/${FIRE_FRAMES[Math.floor(now / 90) % FIRE_FRAMES.length]}`
        if (bank.ok(fpath) && t < 0.95) {
          ctx.save(); ctx.globalAlpha = 0.7 * (1 - t)
          ctx.drawImage(bank.img(fpath), rx - 10 * dpr, ry + rocketH * 0.5 - 6 * dpr, 20 * dpr, 24 * dpr)
          ctx.restore()
        }
        if (t >= 1 && a.phase === 'land') {
          a.phase = 'done'
          setPhase('done')
          playExplosion(0.25)
          for (let i = 0; i < 3; i++) particles.smoke(rx + (i - 1) * 30 * dpr, H * 0.72, 10 * dpr, 1400)
          floaters.banner('ONE SMALL STEP!', 'Mission complete, Commander!')
          // astronaut plants the flag
          setTimeout(() => { playFanfare() }, 900)
          qaExpose({ game: 'rocketlaunch', phase: 'done' })
          setTimeout(onComplete, 3400)
        }
      }

      // fuel-phase idle shake when tank nearly full (anticipation!)
      if (a.phase === 'fuel' && a.fuel >= MAX_FUEL - 2) shaker.add(0.03)

      ctx.save()
      shaker.update(dt)
      shaker.apply(ctx, dpr)

      // steam puffs (fueling) + all particles
      particles.update(dt, dpr)
      particles.draw(ctx, dpr)

      // rocket sprite
      drawSprite(ctx, bank, 'rockets/rocket.png', rx, ry, rocketW, rocketH, { fallback: '#E5E7EB' })

      // astronaut + flag on the moon after landing
      if (a.phase === 'done' || (a.phase === 'land' && animRef.current.landT > 2600)) {
        const ay = H * 0.72
        drawSprite(ctx, bank, 'soldiers/astro1.png', rx + 70 * dpr, ay - 16 * dpr, 30 * dpr, 40 * dpr)
        // flag
        ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 3 * dpr
        ctx.beginPath(); ctx.moveTo(rx + 86 * dpr, ay - 14 * dpr); ctx.lineTo(rx + 86 * dpr, ay - 58 * dpr); ctx.stroke()
        ctx.fillStyle = '#EF4444'
        const fw2 = 26 * dpr
        ctx.beginPath()
        ctx.moveTo(rx + 86 * dpr, ay - 58 * dpr)
        ctx.quadraticCurveTo(rx + 86 * dpr + fw2 / 2, ay - 56 * dpr + Math.sin(now / 300) * 2 * dpr, rx + 86 * dpr + fw2, ay - 52 * dpr)
        ctx.lineTo(rx + 86 * dpr, ay - 46 * dpr)
        ctx.fill()
      }

      floaters.update(dt, dpr)
      floaters.draw(ctx, W, H, dpr)
      ctx.restore()

      // -------- fuel gauge
      const gW = 18 * dpr, gH = H * 0.36, gX = 16 * dpr, gY = H * 0.3
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.beginPath(); ctx.roundRect(gX, gY, gW, gH, 9 * dpr); ctx.fill()
      const frac = a.fuel / MAX_FUEL
      const fillH = gH * frac
      const grad = ctx.createLinearGradient(0, gY + gH - fillH, 0, gY + gH)
      grad.addColorStop(0, '#FB923C'); grad.addColorStop(1, '#EF4444')
      ctx.fillStyle = grad
      ctx.beginPath(); ctx.roundRect(gX + 2 * dpr, gY + gH - Math.max(0, fillH - 2 * dpr), gW - 4 * dpr, Math.max(0, fillH - 2 * dpr), 7 * dpr); ctx.fill()
      if (doubleFuelRef.current && a.phase === 'fuel') {
        ctx.font = `900 ${11 * dpr}px Fredoka, sans-serif`
        ctx.fillStyle = '#FDE047'; ctx.textAlign = 'center'
        ctx.fillText('2x', gX + gW / 2, gY + gH + 16 * dpr)
      }
      ctx.font = `bold ${13 * dpr}px Fredoka, sans-serif`
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'
      ctx.fillText('FUEL', gX + gW / 2, gY - 10 * dpr)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      stopRumble?.()
      fxRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])

  // Speak + banners + QA for the current fuel round.
  useEffect(() => {
    if (!started || phase !== 'fuel') return
    const cur = roundsRef.current[Math.min(roundIdx, TOTAL - 1)]
    if (!cur) return
    if (roundIdx === 0 || roundIdx === W1 || roundIdx === W2) {
      const ph = roundIdx === 0 ? PHASES[0] : roundIdx === W1 ? PHASES[1] : PHASES[2]
      fxRef.current?.floaters.banner(ph.label, ph.sub)
      if (roundIdx === W2) playPowerup()
    }
    speak(cur.word)
    qaExpose({ game: 'rocketlaunch', phase: 'playing', word: cur.word, options: cur.options })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, roundIdx, phase])

  const handleAnswer = (opt: string) => {
    if (answered || phase !== 'fuel' || !round) return
    setChosen(opt); setAnswered(true)
    if (opt === round.word) {
      playCorrect(); onCorrect()
      streakRef.current += 1
      const callout = comboCallout(streakRef.current)
      if (callout) { fxRef.current?.floaters.banner(callout); playComboStreak(streakRef.current) }
      const add = doubleFuelRef.current ? 2 : 1
      if (doubleFuelRef.current) {
        fxRef.current?.floaters.banner('DOUBLE FUEL!', 'Streak reward pumped in!')
        doubleFuelRef.current = false
      }
      if (streakRef.current % 3 === 0) doubleFuelRef.current = true
      const newFuel = Math.min(MAX_FUEL, animRef.current.fuel + add)
      animRef.current.fuel = newFuel
      setHud({ fuel: newFuel, streak: streakRef.current })
      // steam + glow at the pad
      const cvs = canvasRef.current!
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      fxRef.current?.particles.smoke(cvs.clientWidth * 0.5 * dpr - 34 * dpr, cvs.clientHeight * 0.86 * dpr - 20 * dpr, 7 * dpr, 900)
      playPowerup()
      setTimeout(() => {
        setAnswered(false); setChosen(null)
        if (newFuel >= MAX_FUEL) {
          animRef.current.phase = 'countdown'
          setPhase('countdown')
          fxRef.current?.floaters.banner('IGNITION!', 'Stand back, Commander!')
          qaExpose({ game: 'rocketlaunch', phase: 'cinematic' })
        } else setRoundIdx(i => i + 1)
      }, 700)
    } else {
      playWrong(); onWrong()
      streakRef.current = 0
      setHud(h => ({ ...h, streak: 0 }))
      setTimeout(() => { setAnswered(false); setChosen(null); setRoundIdx(i => i + 1) }, 1300)
    }
  }

  if (!started) {
    return (
      <MissionBriefing
        title="Mission Blast Off"
        callsign="CapeKennedy Kids Space Center"
        hero="🚀"
        gradient="from-slate-950 via-indigo-950 to-purple-950"
        orders={[
          { icon: Ear, text: 'Listen to the word and check the picture!' },
          { icon: Fuel, text: 'Tap the fuel cell with that word to pump fuel!' },
          { icon: Zap, text: '3 in a row = DOUBLE FUEL streak reward!' },
          { icon: Moon, text: `Fill all ${MAX_FUEL} cells, then fly to the Moon and land!` },
        ]}
        cta="🚀 Begin Launch Countdown"
        onStart={startMission}
      />
    )
  }

  const prompt = phase === 'fuel' && round ? { emoji: round.emoji, onHear: () => speak(round.word) } : null
  const progress = phase === 'fuel'
    ? `P${roundIdx < W1 ? 1 : roundIdx < W2 ? 2 : 3} · ${(roundIdx < W1 ? roundIdx : roundIdx < W2 ? roundIdx - W1 : roundIdx - W2) + 1}/${PHASES[roundIdx < W1 ? 0 : roundIdx < W2 ? 1 : 2].rounds}`
    : phase === 'countdown' ? 'IGNITION!' : phase === 'launch' ? 'LIFT OFF!' : 'MOON LANDING'

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3">
      <GameHud
        statIcon={Fuel}
        statLabel={`${hud.fuel}/${MAX_FUEL}`}
        prompt={prompt}
        progress={progress}
      />
      <canvas ref={canvasRef} className="w-full rounded-2xl border-4 border-white shadow-clay-card"
        style={{ aspectRatio: '4 / 3', maxHeight: '54vh', background: '#1E1B4B', touchAction: 'none' }} />
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
      {phase !== 'fuel' && (
        <p className="text-clay-cta font-extrabold text-lg animate-pulse-soft" style={{ fontFamily: 'var(--font-display)' }}>
          {phase === 'countdown' ? '🔥 Ignition sequence started…' : phase === 'launch' ? '🚀 We have liftoff!' : '🌙 Landing on the Moon…'}
        </p>
      )}
    </div>
  )
}

const REDUCED_STAR_COUNT = 60

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)]
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)]
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}
