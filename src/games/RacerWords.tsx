import { useEffect, useRef, useState } from 'react'
import { playCorrect, playWrong, playClick, playExplosion, playPowerup, playComboStreak, playFanfare, playLevelUp, playMissionSting, playWarn, speak } from '../hooks/useSound'
import { Flag, Ear, Zap, Flame, Volume2 } from 'lucide-react'
import { makeRounds, ASSET, type Round } from './shared/wordBank'
import { GameHud, MissionBriefing } from './shared/arcade/GameHud'
import {
  loadSprites, drawSprite, Particles, Shaker, Floaters, comboCallout,
} from './shared/arcade/engine'
import type { SpriteBank } from './shared/arcade/engine'
import { qaExpose } from './shared/qa'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

const CAR_SPRITES = ['player.png', 'ai2.png', 'ai1.png', 'ai3.png']
const CAR_NAMES = ['YOU', 'THUNDER', 'Rosie', 'Zoom']
const RIVAL = 1
const FINISH = 0.92
const BOOST = 0.125
const NITRO_BOOST = 0.1
const AI_BASE = 0.0000095
const LAP_MARKS = [0.3, 0.6]
const LAPS_TOTAL = 3

type Car = { prog: number; vel: number; spin: number; lane: number }

export default function RacerWords({ words, onCorrect, onWrong, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [started, setStarted] = useState(false)
  const [roundIdx, setRoundIdx] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [nitro, setNitro] = useState(0)
  const [tires, setTires] = useState(3)
  const [lap, setLap] = useState(1)
  const [result, setResult] = useState<number | null>(null)
  const [hudScore, setHudScore] = useState(0)

  const roundsRef = useRef<Round[]>([])
  if (roundsRef.current.length === 0) roundsRef.current = makeRounds(words, 40, 3)
  const carsRef = useRef<Car[]>([])
  const finishedRef = useRef(false)
  const nitroRef = useRef(0)
  const tiresRef = useRef(3)
  const lapRef = useRef(1)
  const streakRef = useRef(0)
  const scoreRef = useRef(0)
  const fxRef = useRef<{ particles: Particles; shaker: Shaker; floaters: Floaters } | null>(null)

  const round = roundsRef.current.length ? roundsRef.current[roundIdx % roundsRef.current.length] : undefined

  const startMission = () => { playMissionSting(); setStarted(true) }

  useEffect(() => {
    if (!started || result !== null) return
    if (round) {
      speak(round.word)
      qaExpose({ game: 'racerwords', phase: 'playing', word: round.word, options: round.options })
    }
  }, [started, roundIdx, result])

  useEffect(() => {
    if (!started) return
    setRoundIdx(0); setAnswered(false); setChosen(null); setResult(null); setNitro(0); setTires(3); setLap(1); setHudScore(0)
    finishedRef.current = false
    nitroRef.current = 0; tiresRef.current = 3; lapRef.current = 1; streakRef.current = 0; scoreRef.current = 0
    carsRef.current = [0, 1, 2, 3].map(lane => ({ prog: 0, vel: 0, spin: 0, lane }))

    const cvs = canvasRef.current!
    const ctx = cvs.getContext('2d')!
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = (cvs.width = cvs.clientWidth * dpr)
    const H = (cvs.height = cvs.clientHeight * dpr)

    const bank: SpriteBank = loadSprites(CAR_SPRITES.map(c => `cars/${c}`))
    const speedFx = new Image(); speedFx.src = ASSET('assets/fx/speed.png')

    const particles = new Particles()
    const shaker = new Shaker()
    const floaters = new Floaters()
    fxRef.current = { particles, shaker, floaters }

    // rival rubber-band pace: speeds up when behind, chills when ahead
    const aiPace = [0, 1.02 + Math.random() * 0.18, 0.85 + Math.random() * 0.25, 0.92 + Math.random() * 0.22]

    let raf = 0
    let last = performance.now()
    let dashOffset = 0

    const laneY = (lane: number) => H * (0.18 + lane * 0.21)
    const progX = (p: number) => W * (0.06 + p * 0.86)

    const fireNitro = () => {
      if (nitroRef.current <= 0 || finishedRef.current) return
      nitroRef.current -= 1
      setNitro(nitroRef.current)
      const me = carsRef.current[0]
      me.vel += NITRO_BOOST / 170 * 1.6
      playPowerup()
      shaker.add(0.25)
      const y = laneY(0)
      particles.burst(progX(me.prog) - 20 * dpr, y, { count: 20, colors: ['#F97316', '#FECA57', '#EF4444'], speed: 6, size: 5, angle: Math.PI, spread: 1, life: 600, grav: 0 })
      floaters.add(progX(me.prog), y - 40 * dpr, 'NITRO!!', { color: '#F97316', size: 26 })
    }
    // expose nitro to the React button via canvas ref dataset
    ;(cvs as unknown as { __nitro?: () => void }).__nitro = fireNitro

    const draw = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now
      const cars = carsRef.current

      // ---- track: grass borders + clean asphalt
      const edge = 14 * dpr
      ctx.fillStyle = '#4ADE80'
      ctx.fillRect(0, 0, W, edge)
      ctx.fillRect(0, H - edge, W, edge)
      const asphalt = ctx.createLinearGradient(0, 0, 0, H)
      asphalt.addColorStop(0, '#526075')
      asphalt.addColorStop(0.5, '#414D5F')
      asphalt.addColorStop(1, '#374151')
      ctx.fillStyle = asphalt
      ctx.fillRect(0, edge, W, H - edge * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillRect(0, edge, W, 2.5 * dpr)
      ctx.fillRect(0, H - edge - 2.5 * dpr, W, 2.5 * dpr)

      // moving lane dashes (speed feel)
      dashOffset = (dashOffset + dt * 0.05 * (1 + cars[0].vel * 4000)) % (34 * dpr)
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.lineWidth = 3 * dpr
      ctx.setLineDash([18 * dpr, 16 * dpr])
      ctx.lineDashOffset = -dashOffset
      for (let l = 1; l < 4; l++) {
        const y = (laneY(l - 1) + laneY(l)) / 2
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }
      ctx.setLineDash([])

      // finish line (checkered)
      const fx = progX(FINISH)
      const sq = 9 * dpr
      for (let y = 0; y < H; y += sq) {
        for (let i = 0; i < 2; i++) {
          ctx.fillStyle = ((y / sq + i) % 2 < 1) ? '#fff' : '#111'
          ctx.fillRect(fx + i * sq, y, sq, sq)
        }
      }
      // lap marker posts
      for (const m of LAP_MARKS) {
        const lx = progX(m)
        ctx.fillStyle = 'rgba(253,224,71,0.9)'
        ctx.fillRect(lx - 2 * dpr, 0, 4 * dpr, H)
      }

      ctx.save()
      shaker.update(dt)
      shaker.apply(ctx, dpr)

      // ---- move cars
      let anyFinish = false
      for (const c of cars) {
        if (c.lane === 0) {
          c.prog += c.vel * dt
          c.vel *= Math.pow(0.994, dt)
        } else {
          let pace = aiPace[c.lane]
          if (c.lane === RIVAL) {
            // rubber-band rival: accelerates in lap 3 and when behind the player
            const behind = cars[0].prog - c.prog
            pace *= lapRef.current === LAPS_TOTAL ? 1.18 : 1
            pace *= behind > 0.12 ? 1.22 : behind < -0.12 ? 0.88 : 1
          }
          c.prog += AI_BASE * pace * dt * (0.8 + 0.4 * Math.sin(now / 900 + c.lane * 2))
        }
        if (c.spin > 0) c.spin = Math.max(0, c.spin - dt)
        if (c.prog >= FINISH) anyFinish = true
      }

      // lap banners for the player
      if (lapRef.current === 1 && cars[0].prog >= LAP_MARKS[0]) {
        lapRef.current = 2; setLap(2)
        floaters.banner('LAP 2/3', 'Engine upgrade — keep tapping!')
        playLevelUp()
      } else if (lapRef.current === 2 && cars[0].prog >= LAP_MARKS[1]) {
        lapRef.current = 3; setLap(3)
        floaters.banner('FINAL LAP!', 'THUNDER is catching up!')
        playWarn()
      }

      // ---- draw cars
      for (const c of cars) {
        const x = progX(Math.min(c.prog, FINISH))
        const y = laneY(c.lane)
        const rival = c.lane === RIVAL
        const cw = (rival ? 38 : 30) * dpr, ch = (rival ? 66 : 56) * dpr
        // boost flames for player at speed
        if (c.lane === 0 && c.vel > 0.00004) {
          particles.burst(x - 16 * dpr, y, { count: 1, colors: ['#F97316', '#FECA57'], speed: 1.5, size: 3, angle: Math.PI, spread: 0.5, life: 300, grav: 0 })
        }
        if (rival) {
          // rival red glow + sparks
          ctx.save()
          ctx.globalAlpha = 0.3 + 0.12 * Math.sin(now / 200)
          ctx.fillStyle = '#EF4444'
          ctx.beginPath(); ctx.ellipse(x, y, cw * 0.9, ch * 0.62, 0, 0, Math.PI * 2); ctx.fill()
          ctx.restore()
        }
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(Math.PI / 2 + (c.spin > 0 ? (1 - c.spin / 900) * Math.PI * 4 : 0))
        drawSprite(ctx, bank, `cars/${CAR_SPRITES[c.lane]}`, 0, 0, cw, ch, { fallback: c.lane === 0 ? '#3B82F6' : '#EF4444' })
        ctx.restore()
        ctx.font = `900 ${(rival ? 13 : 12) * dpr}px Fredoka, sans-serif`
        ctx.fillStyle = rival ? '#FCA5A5' : c.lane === 0 ? '#FDE047' : 'rgba(255,255,255,0.85)'
        ctx.textAlign = 'center'
        ctx.fillText(CAR_NAMES[c.lane], x, y - (rival ? 40 : 34) * dpr)
      }

      particles.update(dt, dpr)
      particles.draw(ctx, dpr)
      floaters.update(dt, dpr)
      floaters.draw(ctx, W, H, dpr)
      ctx.restore()

      // ---- finish detection
      if (anyFinish && !finishedRef.current) {
        finishedRef.current = true
        const order = [...cars].sort((a, b) => b.prog - a.prog)
        const place = order.findIndex(c => c.lane === 0) + 1
        setResult(place)
        qaExpose({ game: 'racerwords', phase: 'done' })
        if (place === 1) { playFanfare(); floaters.banner('CHEQUERED FLAG!', 'You win the race!') }
        else { playClick(); floaters.banner(`FINISHED ${place}${place === 2 ? 'ND' : place === 3 ? 'RD' : 'TH'}!`, 'Rematch, champion?') }
        setTimeout(onComplete, 2600)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      fxRef.current = null
      delete (cvs as unknown as { __nitro?: () => void }).__nitro
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])

  const handleAnswer = (opt: string) => {
    if (answered || result !== null || !round) return
    setChosen(opt); setAnswered(true)
    const player = carsRef.current[0]
    if (opt === round.word) {
      playCorrect(); onCorrect()
      streakRef.current += 1
      scoreRef.current += 10 + Math.min(25, (streakRef.current - 1) * 5)
      setHudScore(scoreRef.current)
      const callout = comboCallout(streakRef.current)
      if (callout) { fxRef.current?.floaters.banner(callout); playComboStreak(streakRef.current) }
      if (streakRef.current % 3 === 0 && nitroRef.current < 2) {
        nitroRef.current += 1
        setNitro(nitroRef.current)
        playPowerup()
        fxRef.current?.floaters.add(0.3 * 640, lane0Y(), 'NITRO CHARGED!', { color: '#F97316', size: 22 })
      }
      player.vel += BOOST / 170
      setTimeout(() => { setAnswered(false); setChosen(null); setRoundIdx(i => i + 1) }, 450)
    } else {
      playWrong(); onWrong()
      player.spin = 900
      player.vel = 0
      tiresRef.current = Math.max(0, tiresRef.current - 1)
      setTires(tiresRef.current)
      streakRef.current = 0
      playExplosion(0.25)
      fxRef.current?.shaker.add(0.3)
      setTimeout(() => { setAnswered(false); setChosen(null); setRoundIdx(i => i + 1) }, 1200)
    }
  }

  const lane0Y = () => {
    const cvs = canvasRef.current
    return cvs ? cvs.clientHeight * 0.18 : 100
  }

  const fireNitroFromReact = () => {
    const cvs = canvasRef.current
    const fn = cvs ? (cvs as unknown as { __nitro?: () => void }).__nitro : null
    fn?.()
  }

  if (!started) {
    return (
      <MissionBriefing
        title="Turbo Word Race"
        callsign="Championship Grand Prix"
        hero="🏎️"
        gradient="from-red-950 via-orange-950 to-slate-900"
        orders={[
          { icon: Ear, text: 'Listen to the word and check the picture!' },
          { icon: Zap, text: 'Tap the right word for a TURBO BOOST!' },
          { icon: Flame, text: 'Every 3 in a row charges a NITRO button — tap it to fly!' },
          { icon: Volume2, text: 'Wrong word = spin out and lose a tire. Watch out for THUNDER!' },
          { icon: Flag, text: 'Beat THUNDER and the others over 3 laps to win the cup!' },
        ]}
        cta="🏁 Start Your Engine"
        onStart={startMission}
      />
    )
  }

  const prompt = result === null && round ? { emoji: round.emoji, onHear: () => speak(round.word) } : null

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3">
      <GameHud
        statIcon={Flag}
        statLabel={`Lap ${lap}/${LAPS_TOTAL}`}
        statColor="text-clay-cta"
        shields={tires}
        prompt={prompt}
        progress={`${hudScore} pts`}
      />
      <canvas ref={canvasRef} className="w-full rounded-2xl border-4 border-white shadow-clay-card"
        style={{ aspectRatio: '16 / 9', maxHeight: '46vh', background: '#475569', touchAction: 'none' }} />
      {result === null && round ? (
        <div className="w-full space-y-2">
          <div className="flex gap-2 justify-center flex-wrap">
            {round.options.map((opt, i) => {
              const isRight = opt === round.word
              let cls = 'min-h-[54px] min-w-[110px] px-5 py-3 rounded-2xl text-xl font-extrabold transition-all duration-200 border-3'
              if (answered) {
                if (isRight) cls += ' clay-card border-clay-success/30 animate-pop-in'
                else if (chosen === opt) cls += ' bg-clay-error/20 text-clay-error animate-wiggle border-clay-error/30'
                else cls += ' bg-white/30 opacity-40 border-white/20'
              } else cls += ' clay-card-interactive border-white/80 text-clay-text'
              return <button key={`${roundIdx}-${i}`} onClick={() => handleAnswer(opt)} disabled={answered} className={cls} style={{ fontFamily: 'var(--font-display)' }}>{opt}</button>
            })}
          </div>
          <div className="flex justify-center">
            <button
              onClick={fireNitroFromReact}
              disabled={nitro === 0 || answered}
              className={`px-8 py-3 rounded-2xl text-xl font-extrabold border-3 transition-all ${nitro > 0 && !answered ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-white/80 shadow-clay-button animate-pulse-soft hover:scale-105 active:scale-95' : 'bg-white/40 text-clay-text-muted/50 border-white/30'}`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              🔥 NITRO! ({nitro})
            </button>
          </div>
        </div>
      ) : result !== null && (
        <div className="clay-card p-5 text-center animate-pop-in space-y-2">
          <div className="text-5xl">{result === 1 ? '🏆' : result === 2 ? '🥈' : '🏁'}</div>
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
            {result === 1 ? 'You Won the Race!' : `You finished ${result === 2 ? '2nd' : result === 3 ? '3rd' : '4th'}!`}
          </p>
          <p className="text-clay-text-muted font-bold">{result === 1 ? 'Turbo champion!' : 'Answer faster to win next time!'}</p>
        </div>
      )}
    </div>
  )
}
