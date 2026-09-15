import { useEffect, useRef, useState } from 'react'
import { playCorrect, playWrong, playExplosion, playComboStreak, playFanfare, playMissionSting, playWarn, speak } from '../hooks/useSound'
import { Medal, Ear, Crosshair, Shield, Flag, Zap } from 'lucide-react'
import { makeRounds, type Round } from './shared/wordBank'
import { GameHud, MissionBriefing } from './shared/arcade/GameHud'
import {
  loadSprites, drawSprite, drawGlow,
  Particles, Shaker, Floaters, wordPill, comboCallout, roundScore,
} from './shared/arcade/engine'
import type { SpriteBank } from './shared/arcade/engine'
import { qaExpose, qaPoint } from './shared/qa'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

const WAVES = [
  { rounds: 3, options: 3, label: 'WAVE 1', sub: 'Recon patrol spotted!' },
  { rounds: 3, options: 4, label: 'WAVE 2', sub: 'Armored column incoming!' },
  { rounds: 3, options: 4, label: 'WARNING!', sub: 'ENEMY GENERAL APPROACHING' },
]
const W1 = WAVES[0].rounds
const W2 = W1 + WAVES[1].rounds
const TOTAL = W2 + WAVES[2].rounds
const TANK_SPRITES = ['blue.png', 'green.png', 'desert.png', 'grey.png']

type Tank = {
  word: string; sprite: number
  x: number; y: number
  tx: number; ty: number
  driving: boolean; recruited: boolean; shake: number; highlight: number
  general: boolean
}

export default function TroopMarch({ words, onCorrect, onWrong, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [started, setStarted] = useState(false)
  const [roundIdx, setRoundIdx] = useState(0)
  const [done, setDone] = useState(false)
  const [hud, setHud] = useState({ score: 0, shields: 3, streak: 0 })

  const roundsRef = useRef<Round[]>([])
  if (roundsRef.current.length === 0) {
    const w1 = makeRounds(words, WAVES[0].rounds, WAVES[0].options)
    const rest = makeRounds(words, WAVES[1].rounds + WAVES[2].rounds, WAVES[1].options)
    roundsRef.current = [...w1, ...rest]
  }
  const stateRef = useRef({ tanks: [] as Tank[], army: [] as Tank[], locked: false })
  const ptr = useRef(0)
  const scoreRef = useRef(0)
  const streakRef = useRef(0)
  const shieldsRef = useRef(3)
  const fxRef = useRef<{ particles: Particles; shaker: Shaker; floaters: Floaters } | null>(null)

  const rank = ['Private', 'Corporal', 'Sergeant', 'Lieutenant', 'Captain', 'General'][Math.min(Math.floor(scoreRef.current / 60), 5)]

  const startMission = () => { playMissionSting(); setStarted(true) }

  // Main loop first so fxRef exists when round 0 fires (see TargetBlast note).
  useEffect(() => {
    if (!started) return
    setHud({ score: 0, shields: 3, streak: 0 })
    scoreRef.current = 0; streakRef.current = 0; shieldsRef.current = 3; ptr.current = 0
    stateRef.current.army = []

    const cvs = canvasRef.current!
    const ctx = cvs.getContext('2d')!
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = (cvs.width = cvs.clientWidth * dpr)
    const H = (cvs.height = cvs.clientHeight * dpr)

    const bank: SpriteBank = loadSprites([
      ...TANK_SPRITES.map(s => `tanks/${s}`),
      'soldiers/astro1.png', 'soldiers/astro2.png', 'soldiers/astro3.png',
      'tanks/bullet.png', 'tanks/explosion.png',
    ])

    const particles = new Particles()
    const shaker = new Shaker()
    const floaters = new Floaters()
    fxRef.current = { particles, shaker, floaters }

    let raf = 0
    let last = performance.now()

    const armySlot = (n: number) => ({ x: 0.9 - (n % 3) * 0.08, y: 0.42 + Math.floor(n / 3) * 0.15 })

    const onPointer = (e: PointerEvent) => {
      const st = stateRef.current
      if (st.locked) return
      const r = cvs.getBoundingClientRect()
      const px = ((e.clientX - r.left) / r.width) * W
      const py = ((e.clientY - r.top) / r.height) * H
      const hit = st.tanks.find(t => !t.recruited &&
        Math.abs(t.x * W - px) < (t.general ? 80 : 62) * dpr &&
        Math.abs(t.y * H - py) < (t.general ? 70 : 55) * dpr)
      if (!hit) return
      st.locked = true
      const cur = roundsRef.current[ptr.current]
      const hx = hit.x * W, hy = hit.y * H
      if (hit.word === cur.word) {
        playCorrect(); onCorrect()
        streakRef.current += 1
        const gained = roundScore(streakRef.current, hit.general)
        scoreRef.current += gained
        setHud({ score: scoreRef.current, shields: shieldsRef.current, streak: streakRef.current })
        floaters.add(hx, hy - 50 * dpr, `+${gained}`, { color: hit.general ? '#FECA57' : '#1DD1A1', size: hit.general ? 30 : 22 })
        const callout = comboCallout(streakRef.current)
        if (callout) { floaters.banner(callout); playComboStreak(streakRef.current) }
        // cannonball salute + explosion puff at the tapped tank
        playExplosion(hit.general ? 0.7 : 0.3)
        particles.burst(hx, hy, { count: hit.general ? 40 : 22, speed: 7, size: 5, life: 900 })
        particles.ring(hx, hy, '#FECA57', hit.general ? 70 : 40)
        shaker.add(hit.general ? 0.45 : 0.2)
        hit.recruited = true
        hit.driving = true
        const slot = armySlot(stateRef.current.army.length)
        hit.tx = slot.x; hit.ty = slot.y
        stateRef.current.army.push(hit)
        advance(hit.general ? 1500 : 1150)
      } else {
        playWrong(); onWrong(); playWarn()
        shieldsRef.current = Math.max(0, shieldsRef.current - 1)
        streakRef.current = 0
        setHud({ score: scoreRef.current, shields: shieldsRef.current, streak: 0 })
        floaters.add(hx, hy - 50 * dpr, 'SHIELD DOWN!', { color: '#FF6B6B', size: 20 })
        hit.shake = 1
        const right = stateRef.current.tanks.find(t => t.word === cur.word)
        if (right) right.highlight = 1
        shaker.add(0.3)
        advance(1600)
      }
    }
    cvs.addEventListener('pointerdown', onPointer)

    const advance = (delay: number) => {
      setTimeout(() => {
        ptr.current += 1
        if (ptr.current >= TOTAL) {
          playExplosion(0.6)
          playFanfare()
          floaters.banner('MISSION COMPLETE!', 'The General surrenders — hip hip hooray!')
          qaExpose({ game: 'troopmarch', phase: 'done' })
          setDone(true)
          setTimeout(onComplete, 3000)
        } else {
          setRoundIdx(ptr.current)
        }
      }, delay)
    }

    const drawTank = (t: Tank, scale = 1) => {
      const img = `tanks/${TANK_SPRITES[t.sprite]}`
      const tw = (t.general ? 128 : 78) * dpr * scale
      const th = (t.general ? 102 : 62) * dpr * scale
      const sx = t.shake > 0 ? Math.sin(t.shake * 40) * 5 * dpr * t.shake : 0
      if (t.general) drawGlow(ctx, t.x * W + sx, t.y * H, tw * 0.8, 'rgba(239,68,68,0.4)', 0.35 + 0.15 * Math.sin(performance.now() / 260))
      ctx.save()
      ctx.translate(t.x * W + sx, t.y * H)
      ctx.rotate(Math.PI / 2)
      drawSprite(ctx, bank, img, 0, 0, tw, th, { fallback: '#4B5563' })
      ctx.restore()
      if (t.general) {
        ctx.font = `900 ${13 * dpr}px Fredoka, sans-serif`
        ctx.fillStyle = '#FCA5A5'
        ctx.textAlign = 'center'
        ctx.fillText('ENEMY GENERAL', t.x * W, t.y * H - th / 2 - 14 * dpr)
      }
    }

    const draw = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now
      const st = stateRef.current

      // ---- battlefield: sky, sun, clouds, hills, ground
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.68)
      sky.addColorStop(0, '#7DD3FC'); sky.addColorStop(1, '#E0F2FE')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, H * 0.68)
      ctx.fillStyle = '#FDE047'
      ctx.beginPath(); ctx.arc(W * 0.08, H * 0.1, 26 * dpr, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      for (let i = 0; i < 4; i++) {
        const cx2 = ((now * 0.006 * (0.5 + i * 0.2) + i * 300) % (W + 160 * dpr)) - 80 * dpr
        const cy2 = H * (0.06 + i * 0.045)
        ctx.beginPath()
        ctx.ellipse(cx2, cy2, 38 * dpr, 13 * dpr, 0, 0, Math.PI * 2)
        ctx.ellipse(cx2 + 24 * dpr, cy2 - 8 * dpr, 24 * dpr, 11 * dpr, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      // distant hills (two parallax ridges)
      ctx.fillStyle = '#6EE7A0'
      ctx.beginPath(); ctx.ellipse(W * 0.25, H * 0.7, W * 0.42, H * 0.14, 0, Math.PI, 0); ctx.fill()
      ctx.fillStyle = '#34D399'
      ctx.beginPath(); ctx.ellipse(W * 0.82, H * 0.71, W * 0.38, H * 0.17, 0, Math.PI, 0); ctx.fill()
      // ground
      const gr = ctx.createLinearGradient(0, H * 0.7, 0, H)
      gr.addColorStop(0, '#4ADE80'); gr.addColorStop(1, '#16A34A')
      ctx.fillStyle = gr
      ctx.fillRect(0, H * 0.7, W, H * 0.3)
      // grass tufts + tire tracks
      ctx.fillStyle = 'rgba(22,101,52,0.3)'
      for (let i = 0; i < 16; i++) {
        const gx = (i * 0.064 + 0.02) * W, gy = H * (0.74 + (i % 4) * 0.055)
        ctx.fillRect(gx, gy, 8 * dpr, 2.5 * dpr)
      }
      ctx.strokeStyle = 'rgba(80,60,20,0.18)'
      ctx.lineWidth = 5 * dpr
      ctx.setLineDash([16 * dpr, 22 * dpr])
      ctx.beginPath(); ctx.moveTo(0, H * 0.88); ctx.lineTo(W, H * 0.86); ctx.stroke()
      ctx.setLineDash([])

      // ---- HQ base with flag + soldiers
      const fx2 = W * 0.88, fy2 = H * 0.14
      ctx.fillStyle = '#92400E'; ctx.fillRect(fx2, fy2, 4 * dpr, 78 * dpr)
      const wave = Math.sin(now / 300) * 3 * dpr
      ctx.fillStyle = '#EF4444'
      ctx.beginPath()
      ctx.moveTo(fx2 + 4 * dpr, fy2)
      ctx.quadraticCurveTo(fx2 + 28 * dpr, fy2 + 6 * dpr + wave, fx2 + 50 * dpr, fy2 + 12 * dpr)
      ctx.lineTo(fx2 + 4 * dpr, fy2 + 24 * dpr)
      ctx.fill()
      ctx.font = `bold ${13 * dpr}px Fredoka, sans-serif`
      ctx.fillStyle = '#1E1B4B'; ctx.textAlign = 'center'
      ctx.fillText('HQ', fx2 + 2 * dpr, fy2 + 92 * dpr)
      const nSold = Math.min(3, Math.floor(st.army.length / 3))
      for (let i = 0; i < nSold; i++) {
        drawSprite(ctx, bank, `soldiers/astro${i + 1}.png`, fx2 - 28 * dpr - i * 26 * dpr, fy2 + 56 * dpr, 28 * dpr, 36 * dpr)
      }

      ctx.save()
      shaker.update(dt)
      shaker.apply(ctx, dpr)

      // ---- recruited army driving into formation
      for (const t of st.army) {
        if (t.driving) {
          const dx = t.tx - t.x, dy = t.ty - t.y
          t.x += dx * dt * 0.004; t.y += dy * dt * 0.004
          if (Math.random() < 0.4) particles.smoke(t.x * W - 34 * dpr, t.y * H + 12 * dpr, 5 * dpr, 700)
          if (Math.abs(dx) < 0.006 && Math.abs(dy) < 0.006) t.driving = false
        }
        drawTank(t, 0.6)
      }

      // ---- candidate tanks with word pills
      for (const t of st.tanks) {
        if (t.recruited) continue
        if (t.shake > 0) t.shake = Math.max(0, t.shake - dt * 0.0015)
        drawTank(t)
        const ux = t.x * W, uy = t.y * H
        wordPill(ctx, ux, uy + (t.general ? 58 : 44) * dpr, t.word, dpr, t.highlight > 0 ? 'right' : 'idle')
        if (t.highlight > 0) t.highlight = Math.max(0, t.highlight - dt * 0.001)
        const cur = roundsRef.current[ptr.current]
        if (cur && t.word === cur.word) qaPoint(ux / dpr, uy / dpr)
      }

      particles.update(dt, dpr)
      particles.draw(ctx, dpr)
      floaters.update(dt, dpr)
      floaters.draw(ctx, W, H, dpr)
      ctx.restore()

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

  // Round setup: place candidate tanks (general tank in wave 3).
  useEffect(() => {
    if (!started || done) return
    const cur = roundsRef.current[roundIdx]
    if (!cur) return
    ptr.current = roundIdx

    if (roundIdx === W1 || roundIdx === W2) {
      playWarn()
      fxRef.current?.floaters.banner(WAVES[roundIdx <= W1 ? 1 : 2].label, WAVES[roundIdx <= W1 ? 1 : 2].sub)
    } else if (roundIdx === 0) {
      fxRef.current?.floaters.banner(WAVES[0].label, WAVES[0].sub)
    }
    speak(cur.word)

    const waveIdx = roundIdx < W1 ? 0 : roundIdx < W2 ? 1 : 2
    const isBossWave = waveIdx === 2
    stateRef.current.tanks = cur.options.map((word, i) => {
      const general = isBossWave && word === cur.word
      const col = i % 2, row = Math.floor(i / 2)
      return {
        word,
        sprite: general ? 3 : (i + roundIdx) % TANK_SPRITES.length,
        // boss wave: general alone at centre, decoys in a left column
        x: general ? 0.52 : isBossWave ? 0.15 + row * 0.15 : 0.17 + col * 0.27 + (row ? 0.06 : 0),
        y: general ? 0.34 : isBossWave ? 0.3 + col * 0.3 : (0.32 + row * 0.3 + (col ? 0.03 : 0)),
        tx: 0, ty: 0, driving: false, recruited: false, shake: 0, highlight: 0, general,
      }
    })
    stateRef.current.locked = false
    setHud(h => ({ ...h, shields: shieldsRef.current, streak: streakRef.current }))

    qaExpose({
      game: 'troopmarch',
      phase: isBossWave ? 'boss' : 'playing',
      word: cur.word,
      options: cur.options,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, roundIdx, done])

  if (!started) {
    return (
      <MissionBriefing
        title="Word Army"
        callsign="Recruiting Office HQ"
        hero="🪖"
        gradient="from-emerald-950 via-green-900 to-lime-950"
        orders={[
          { icon: Ear, text: 'Listen to the word and check the picture!' },
          { icon: Crosshair, text: 'Tap the tank carrying that word — it joins YOUR army!' },
          { icon: Zap, text: 'Combo streaks earn medals and promotions!' },
          { icon: Shield, text: 'You have 3 shields. Wrong taps cost one!' },
          { icon: Flag, text: 'Capture the code from the ENEMY GENERAL to win!' },
        ]}
        cta="🎖️ Start Recruiting"
        onStart={startMission}
      />
    )
  }

  const cur = roundsRef.current[Math.min(roundIdx, TOTAL - 1)]
  const prompt = done || !cur ? null : { emoji: cur.emoji, onHear: () => speak(cur.word) }
  const isBossWave = roundIdx >= W2

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3">
      <GameHud
        statIcon={Medal}
        statLabel={done ? 'General' : rank || 'Private'}
        statColor="text-clay-yellow"
        shields={hud.shields}
        prompt={prompt}
        progress={isBossWave ? `BOSS ${Math.min(roundIdx - W2 + 1, 3)}/3` : `W${waveNum(roundIdx)} · ${(roundIdx % 3) + 1}/3`}
      />
      <canvas ref={canvasRef} className="w-full rounded-2xl border-4 border-white shadow-clay-card"
        style={{ aspectRatio: '4 / 3', maxHeight: '58vh', background: '#E0F2FE', touchAction: 'none' }} />
      {!done && <p className="text-clay-text-muted text-base font-semibold text-center">🪖 Tap the tank carrying the word you hear to recruit it!</p>}
      {done && (
        <div className="clay-card p-5 text-center animate-pop-in space-y-2">
          <Medal className="w-10 h-10 text-clay-yellow mx-auto" strokeWidth={2.5} />
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Enemy General captured!</p>
        </div>
      )}
    </div>
  )
}

function waveNum(idx: number): number {
  return idx < 3 ? 1 : idx < 6 ? 2 : 3
}
