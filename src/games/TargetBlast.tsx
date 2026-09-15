import { useEffect, useRef, useState } from 'react'
import { playCorrect, playWrong, playLaser, playExplosion, playPowerup, playComboStreak, playFanfare, playMissionSting, playWarn, speak } from '../hooks/useSound'
import { Crosshair, Ear, Zap, Shield, Rocket } from 'lucide-react'
import { makeRounds, type Round } from './shared/wordBank'
import { GameHud, MissionBriefing } from './shared/arcade/GameHud'
import {
  loadSprites, drawSprite, drawGlow, drawNebula, drawStarField, makeStarField, drawPlanet,
  Particles, Shaker, Floaters, wordPill, comboCallout, roundScore, REDUCED_MOTION,
} from './shared/arcade/engine'
import type { SpriteBank } from './shared/arcade/engine'
import { qaExpose, qaPoint } from './shared/qa'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

const WAVES = [
  { rounds: 3, options: 3, speed: 1, label: 'WAVE 1', sub: 'Scramble, cadets!' },
  { rounds: 3, options: 4, speed: 1.55, label: 'WAVE 2', sub: 'They fly faster now!' },
  { rounds: 3, options: 4, speed: 2.1, label: 'WARNING!', sub: 'MOTHERSHIP APPROACHING' },
]
const W1 = WAVES[0].rounds
const W2 = W1 + WAVES[1].rounds
const TOTAL = W2 + WAVES[2].rounds
const UFO_SPRITES = ['ufoBlue.png', 'ufoGreen.png', 'ufoRed.png', 'ufoYellow.png']
const FIRE_FRAMES = ['fire00.png', 'fire04.png', 'fire08.png', 'fire12.png', 'fire16.png']

type Ufo = { word: string; x: number; y: number; vx: number; bob: number; sprite: number; dead: boolean; flash: number; boss: boolean }
type Laser = { x: number; y: number; tx: number; ty: number; t: number; word: string }
type RoundMeta = { round: Round; wave: number; slow: boolean }

export default function TargetBlast({ words, onCorrect, onWrong, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [started, setStarted] = useState(false)
  const [roundIdx, setRoundIdx] = useState(0)
  const [done, setDone] = useState(false)
  const [hud, setHud] = useState({ score: 0, shields: 3, streak: 0 })

  const roundsRef = useRef<RoundMeta[]>([])
  if (roundsRef.current.length === 0) {
    const w1 = makeRounds(words, WAVES[0].rounds, WAVES[0].options)
    const rest = makeRounds(words, WAVES[1].rounds + WAVES[2].rounds, WAVES[1].options)
    roundsRef.current = [...w1, ...rest].map((round, idx) => ({
      round,
      wave: idx < W1 ? 0 : idx < W2 ? 1 : 2,
      slow: false,
    }))
  }
  const stateRef = useRef({ ufos: [] as Ufo[], lasers: [] as Laser[], locked: false, cannonX: 0, vignette: 0 })
  const ptr = useRef(0)
  const scoreRef = useRef(0)
  const streakRef = useRef(0)
  const shieldsRef = useRef(3)
  const fxRef = useRef<{ particles: Particles; shaker: Shaker; floaters: Floaters } | null>(null)

  const startMission = () => { playMissionSting(); setStarted(true) }

  // Main loop: owns the canvas, particles and all drawing. Declared before
  // the setup effect so fxRef exists when round 0's banner fires.
  useEffect(() => {
    if (!started) return
    setHud({ score: 0, shields: 3, streak: 0 })
    scoreRef.current = 0; streakRef.current = 0; shieldsRef.current = 3; ptr.current = 0
    stateRef.current.vignette = 0

    const cvs = canvasRef.current!
    const ctx = cvs.getContext('2d')!
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = (cvs.width = cvs.clientWidth * dpr)
    const H = (cvs.height = cvs.clientHeight * dpr)
    stateRef.current.cannonX = W / 2

    const bank: SpriteBank = loadSprites([
      'ufo/ufoBlue.png', 'ufo/ufoGreen.png', 'ufo/ufoRed.png', 'ufo/ufoYellow.png',
      'ships/player.png', 'missiles/laser.png', ...FIRE_FRAMES.map(f => `fx/${f}`),
    ])

    const particles = new Particles()
    const shaker = new Shaker()
    const floaters = new Floaters()
    fxRef.current = { particles, shaker, floaters }
    const stars = makeStarField(W, H, REDUCED_MOTION ? 40 : 90)

    let raf = 0
    let last = performance.now()

    const fireAt = (ufo: Ufo) => {
      const st = stateRef.current
      if (st.locked) return
      st.locked = true
      playLaser()
      const sx = st.cannonX
      const sy = H - 64 * dpr
      particles.burst(sx, sy, { count: 6, colors: ['#F97316', '#FECA57'], speed: 3, size: 3, angle: -Math.PI / 2, spread: 0.7, life: 350, grav: 0 })
      shaker.add(0.1)
      st.lasers.push({ x: sx, y: sy, tx: ufo.x * W, ty: ufo.y * H, t: 0, word: ufo.word })
    }

    const onPointer = (e: PointerEvent) => {
      const r = cvs.getBoundingClientRect()
      const px = ((e.clientX - r.left) / r.width) * W
      const py = ((e.clientY - r.top) / r.height) * H
      const st = stateRef.current
      const hit = [...st.ufos].sort((a, b) => (a.boss ? -1 : 0) + (b.boss ? 1 : 0)).find(u => {
        if (u.dead) return false
        const rad = (u.boss ? 74 : 56) * dpr
        return Math.abs(u.x * W - px) < rad && Math.abs(u.y * H - py) < rad
      })
      if (hit) fireAt(hit)
    }
    cvs.addEventListener('pointerdown', onPointer)

    const nextRound = (delay: number) => {
      setTimeout(() => {
        ptr.current += 1
        if (ptr.current >= TOTAL) {
          const boss = stateRef.current.ufos.find(u => u.boss)
          const bx = (boss && !boss.dead ? boss.x : 0.5) * W
          const by = (boss && !boss.dead ? boss.y : 0.3) * H
          playExplosion(1)
          shaker.add(1)
          particles.burst(bx, by, { count: 60, speed: 9, size: 7, life: 1400 })
          particles.ring(bx, by, '#FECA57', 130, 700)
          setTimeout(() => { playExplosion(0.7); particles.burst(bx + 40 * dpr, by - 20 * dpr, { count: 30, speed: 7, life: 1000 }); particles.ring(bx, by, '#FF6B6B', 95, 500); shaker.add(0.5) }, 350)
          setTimeout(() => { playExplosion(0.5); particles.burst(bx - 50 * dpr, by + 30 * dpr, { count: 24, speed: 6, life: 900 }); shaker.add(0.4) }, 700)
          floaters.banner('MOTHERSHIP DOWN!', 'MISSION COMPLETE')
          playFanfare()
          qaExpose({ game: 'targetblast', phase: 'done' })
          setDone(true)
          setTimeout(onComplete, 3200)
        } else {
          setRoundIdx(ptr.current)
        }
      }, delay)
    }

    const resolveHit = (laser: Laser) => {
      const st = stateRef.current
      const meta = roundsRef.current[ptr.current]
      const ufo = st.ufos.find(u => u.word === laser.word)
      if (!meta || !ufo) { st.locked = false; return }
      const bx = ufo.x * W, by = ufo.y * H
      if (laser.word === meta.round.word) {
        playCorrect(); playExplosion(ufo.boss ? 0.9 : 0.45); onCorrect()
        streakRef.current += 1
        const gained = roundScore(streakRef.current, ufo.boss)
        scoreRef.current += gained
        setHud({ score: scoreRef.current, shields: shieldsRef.current, streak: streakRef.current })
        floaters.add(bx, by - 40 * dpr, `+${gained}`, { color: ufo.boss ? '#FECA57' : '#1DD1A1', size: ufo.boss ? 32 : 22 })
        const callout = comboCallout(streakRef.current)
        if (callout) { floaters.banner(callout); playComboStreak(streakRef.current) }
        if (streakRef.current % 3 === 0 && ptr.current + 1 < TOTAL) {
          roundsRef.current[ptr.current + 1].slow = true
        }
        particles.burst(bx, by, { count: ufo.boss ? 44 : 26, speed: 8, size: 6, life: 1000 })
        particles.ring(bx, by, '#48DBFB', ufo.boss ? 80 : 46)
        shaker.add(ufo.boss ? 0.5 : 0.25)
        ufo.dead = true
        nextRound(ufo.boss ? 1200 : 900)
      } else {
        playWrong(); onWrong(); playWarn()
        shieldsRef.current = Math.max(0, shieldsRef.current - 1)
        streakRef.current = 0
        setHud({ score: scoreRef.current, shields: shieldsRef.current, streak: 0 })
        floaters.add(bx, by - 40 * dpr, 'SHIELD DOWN!', { color: '#FF6B6B', size: 20 })
        st.vignette = 1
        shaker.add(0.35)
        ufo.flash = 1
        const right = st.ufos.find(u => u.word === meta.round.word)
        if (right) right.flash = -1
        nextRound(1600)
      }
    }

    const draw = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now
      const st = stateRef.current
      const meta = roundsRef.current[ptr.current]

      drawNebula(ctx, W, H, now, ['#0b1026', '#1E1B4B', '#312E81'])
      drawStarField(ctx, stars, dt, dpr, 1)
      drawPlanet(ctx, W * 0.86, H * 0.13, 32 * dpr, '#FDE68A', '#B45309')
      drawPlanet(ctx, W * 0.1, H * 0.32, 18 * dpr, '#93C5FD', '#1D4ED8', 'rgba(255,255,255,0.5)')

      ctx.save()
      shaker.update(dt)
      shaker.apply(ctx, dpr)

      for (const u of st.ufos) {
        if (u.dead) continue
        u.bob += dt * 0.003
        u.x += u.vx * dt
        const margin = u.boss ? 0.17 : 0.12
        if (u.x < margin || u.x > 1 - margin) u.vx *= -1
        const ux = u.x * W
        const uy = u.y * H + Math.sin(u.bob) * 9 * dpr
        const size = (u.boss ? 108 : 74) * dpr * (u.flash > 0 ? 1 + u.flash * 0.12 : 1)
        if (u.boss) {
          drawGlow(ctx, ux, uy, size * 0.95, 'rgba(239,68,68,0.5)', 0.45 + 0.2 * Math.sin(now / 240))
          const bossStep = Math.max(0, ptr.current - W2)
          for (let hp = 0; hp < 3; hp++) {
            ctx.fillStyle = hp < 3 - bossStep ? '#EF4444' : 'rgba(255,255,255,0.25)'
            ctx.beginPath()
            ctx.arc(ux + (hp - 1) * 18 * dpr, uy - size / 2 - 20 * dpr, 6 * dpr, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.font = `900 ${13 * dpr}px Fredoka, sans-serif`
          ctx.fillStyle = '#FCA5A5'
          ctx.textAlign = 'center'
          ctx.fillText('MOTHERSHIP', ux, uy - size / 2 - 34 * dpr)
        }
        ctx.save()
        if (u.flash > 0) { ctx.filter = 'grayscale(1) brightness(1.6)'; u.flash = Math.max(0, u.flash - dt * 0.002) }
        drawSprite(ctx, bank, `ufo/${UFO_SPRITES[u.sprite]}`, ux, uy, size, size, { rot: Math.sin(u.bob * 0.7) * 0.06 })
        ctx.restore()
        wordPill(ctx, ux, uy + size / 2 + 5 * dpr, u.word, dpr, u.flash === -1 ? 'right' : 'idle')
        if (meta && u.word === meta.round.word) qaPoint(ux / dpr, uy / dpr)
      }

      const shipX = st.cannonX
      const shipY = H - 46 * dpr
      const flamePath = `fx/${FIRE_FRAMES[Math.floor(now / 70) % FIRE_FRAMES.length]}`
      if (bank.ok(flamePath)) {
        ctx.save()
        ctx.translate(shipX, shipY + 24 * dpr)
        ctx.globalAlpha = 0.9
        ctx.drawImage(bank.img(flamePath), -11 * dpr, 0, 22 * dpr, 30 * dpr)
        ctx.restore()
      }
      drawSprite(ctx, bank, 'ships/player.png', shipX, shipY, 62 * dpr, 62 * dpr, { rot: Math.PI })

      for (const l of st.lasers) {
        l.t = Math.min(1, l.t + dt * 0.004)
        const lx = l.x + (l.tx - l.x) * l.t
        const ly = l.y + (l.ty - l.y) * l.t
        drawGlow(ctx, lx, ly, 14 * dpr, 'rgba(252,202,87,0.8)', 0.5)
        const ang = Math.atan2(l.ty - l.y, l.tx - l.x) + Math.PI / 2
        drawSprite(ctx, bank, 'missiles/laser.png', lx, ly, 14 * dpr, 34 * dpr, { rot: ang })
        if (l.t >= 1) resolveHit(l)
      }
      st.lasers = st.lasers.filter(l => l.t < 1)

      particles.update(dt, dpr)
      particles.draw(ctx, dpr)
      floaters.update(dt, dpr)
      floaters.draw(ctx, W, H, dpr)

      ctx.restore()

      if (st.vignette > 0) {
        st.vignette = Math.max(0, st.vignette - dt / 700)
        const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75)
        vg.addColorStop(0, 'rgba(239,68,68,0)')
        vg.addColorStop(1, `rgba(239,68,68,${0.4 * st.vignette})`)
        ctx.fillStyle = vg
        ctx.fillRect(0, 0, W, H)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      cvs.removeEventListener('pointerdown', onPointer)
      fxRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])

  // Round setup: place UFOs, speak the word, wave banners.
  useEffect(() => {
    if (!started || done) return
    const meta = roundsRef.current[roundIdx]
    if (!meta) return
    ptr.current = roundIdx

    const w = WAVES[meta.wave]
    const slowActive = meta.slow
    const speedMul = slowActive ? w.speed * 0.25 : w.speed
    if (slowActive) {
      playPowerup()
      fxRef.current?.floaters.banner('SLOW-MO!', 'Targets slowed — take the shot!')
    } else if (roundIdx === W2) {
      playWarn()
      fxRef.current?.floaters.banner(w.label, w.sub)
    } else if (roundIdx === 0 || roundIdx === W1) {
      fxRef.current?.floaters.banner(w.label, w.sub)
      if (roundIdx === W1) playWarn()
    }
    speak(meta.round.word)

    const st = stateRef.current
    const lanes = meta.round.options.length
    st.ufos = meta.round.options.map((word, i) => {
      const boss = meta.wave === 2 && word === meta.round.word
      const x = boss ? 0.5 : 0.14 + (0.72 / Math.max(1, lanes - 1)) * i + (Math.random() - 0.5) * 0.05
      const y = boss ? 0.24 : 0.24 + (i % 2) * 0.2 + Math.random() * 0.07
      return {
        word, x, y,
        vx: (Math.random() > 0.5 ? 1 : -1) * (0.00035 + Math.random() * 0.0005) * speedMul * (boss ? 1.5 : 1),
        bob: Math.random() * Math.PI * 2,
        sprite: boss ? 2 : i % UFO_SPRITES.length,
        dead: false, flash: 0, boss,
      }
    })
    st.locked = false
    setHud(h => ({ ...h, shields: shieldsRef.current, streak: streakRef.current }))

    qaExpose({
      game: 'targetblast',
      phase: meta.wave === 2 ? 'boss' : 'playing',
      word: meta.round.word,
      options: meta.round.options,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, roundIdx, done])

  if (!started) {
    return (
      <MissionBriefing
        title="UFO Blast"
        callsign="Space Defense Command"
        hero="🛸"
        gradient="from-indigo-950 via-indigo-900 to-purple-950"
        orders={[
          { icon: Ear, text: 'Listen to the word and check the picture!' },
          { icon: Crosshair, text: 'Find the UFO carrying that word — tap to blast it!' },
          { icon: Zap, text: 'Every 3 in a row charges SLOW-MO for the next UFO wave!' },
          { icon: Shield, text: 'You have 3 shields. Wrong taps cost a shield!' },
          { icon: Rocket, text: 'Survive 2 waves, then blast the MOTHERSHIP 3 times!' },
        ]}
        cta="🚀 Start Mission"
        onStart={startMission}
      />
    )
  }

  const meta = roundsRef.current[Math.min(roundIdx, TOTAL - 1)]
  const prompt = done || !meta ? null : { emoji: meta.round.emoji, onHear: () => speak(meta.round.word) }
  const bossStep = Math.max(0, Math.min(3, roundIdx - W2))

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3">
      <GameHud
        statIcon={Crosshair}
        statLabel={`${hud.score}`}
        shields={hud.shields}
        prompt={prompt}
        progress={roundIdx >= W2 ? `BOSS ${bossStep + 1}/3` : `W${meta.wave + 1} · ${(roundIdx % 3) + 1}/3`}
      />
      <canvas ref={canvasRef} className="w-full rounded-2xl border-4 border-white shadow-clay-card"
        style={{ aspectRatio: '4 / 3', maxHeight: '58vh', background: '#0b1026', touchAction: 'none' }} />
      {!done && <p className="text-clay-text-muted text-base font-semibold text-center">🛸 Tap the UFO carrying the word you hear — combo streaks score more!</p>}
      {done && (
        <div className="clay-card p-5 text-center animate-pop-in space-y-2">
          <Rocket className="w-10 h-10 text-clay-cta mx-auto" strokeWidth={2.5} />
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Mothership destroyed, Commander!</p>
        </div>
      )}
    </div>
  )
}
