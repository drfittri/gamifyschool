import { useEffect, useRef, useState } from 'react'
import { playCorrect, playWrong, playClick, playLevelUp, speak } from '../hooks/useSound'
import { Volume2, Flag } from 'lucide-react'
import { makeRounds, ASSET, type Round } from './shared/wordBank'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

const CAR_SPRITES = ['cars/player.png', 'cars/ai1.png', 'cars/ai2.png', 'cars/ai3.png']
const CAR_NAMES = ['You', 'Bolt', 'Flash', 'Zoom']
const FINISH = 0.92
const BOOST = 0.125          // progress per correct answer
const AI_BASE = 0.0000095    // AI progress per ms (~80s to finish)

type Car = { prog: number; vel: number; spin: number; lane: number }

export default function RacerWords({ words, onCorrect, onWrong, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [started, setStarted] = useState(false)
  const [roundIdx, setRoundIdx] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [result, setResult] = useState<number | null>(null) // player finishing place, 1-based
  const roundsRef = useRef<Round[]>([])
  if (roundsRef.current.length === 0) roundsRef.current = makeRounds(words, 40, 3)
  const carsRef = useRef<Car[]>([])
  const finishedRef = useRef(false)

  const round = roundsRef.current.length ? roundsRef.current[roundIdx % roundsRef.current.length] : undefined

  useEffect(() => {
    if (!started || result !== null) return
    if (round) speak(round.word)
  }, [started, roundIdx, result])

  useEffect(() => {
    if (!started) return
    setRoundIdx(0); setAnswered(false); setChosen(null); setResult(null)
    finishedRef.current = false
    carsRef.current = [0, 1, 2, 3].map(lane => ({
      prog: 0, vel: 0, spin: 0, lane,
    }))

    const cvs = canvasRef.current!
    const ctx = cvs.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const W = (cvs.width = cvs.clientWidth * dpr)
    const H = (cvs.height = cvs.clientHeight * dpr)

    const sprites: Record<string, HTMLImageElement> = {}
    CAR_SPRITES.forEach(p => { const img = new Image(); img.src = ASSET(`assets/${p}`); sprites[p] = img })
    const road = new Image(); road.src = ASSET('assets/road/roadTile1.png')
    const grass = new Image(); grass.src = ASSET('assets/road/terrain.png')
    const speedFx = new Image(); speedFx.src = ASSET('assets/fx/speed.png')

    // per-AI pace multipliers, randomized each race
    const aiPace = [0, 0.9 + Math.random() * 0.25, 0.85 + Math.random() * 0.3, 0.95 + Math.random() * 0.2]

    let raf = 0
    let last = performance.now()

    const laneY = (lane: number) => H * (0.18 + lane * 0.21)
    const progX = (p: number) => W * (0.06 + p * 0.86)

    const draw = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now
      const cars = carsRef.current

      // grass borders
      const tile = 48 * dpr
      if (grass.complete && grass.naturalWidth) {
        for (let x = 0; x < W; x += tile) {
          ctx.drawImage(grass, x, 0, tile, tile / 2)
          ctx.drawImage(grass, x, H - tile / 2, tile, tile / 2)
        }
      } else { ctx.fillStyle = '#4ADE80'; ctx.fillRect(0, 0, W, H) }
      // road body
      if (road.complete && road.naturalWidth) {
        for (let x = 0; x < W; x += tile)
          for (let y = tile / 2; y < H - tile / 2; y += tile)
            ctx.drawImage(road, x, y, tile, tile)
      } else { ctx.fillStyle = '#475569'; ctx.fillRect(0, tile / 2, W, H - tile) }
      // lane dashes
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.lineWidth = 3 * dpr
      ctx.setLineDash([18 * dpr, 16 * dpr])
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

      // move cars
      let anyFinish = false
      for (const c of cars) {
        if (c.lane === 0) {
          // player: velocity from boosts, eased
          c.prog += c.vel * dt
          c.vel *= Math.pow(0.994, dt)
        } else {
          c.prog += AI_BASE * aiPace[c.lane] * dt * (0.8 + 0.4 * Math.sin(now / 900 + c.lane * 2))
        }
        if (c.spin > 0) c.spin = Math.max(0, c.spin - dt)
        if (c.prog >= FINISH) anyFinish = true
      }

      // draw cars
      for (const c of cars) {
        const x = progX(Math.min(c.prog, FINISH))
        const y = laneY(c.lane)
        const img = sprites[CAR_SPRITES[c.lane]]
        const cw = 30 * dpr, ch = 56 * dpr
        // boost streaks behind player
        if (c.lane === 0 && c.vel > 0.00004 && speedFx.complete && speedFx.naturalWidth) {
          ctx.save(); ctx.translate(x - 34 * dpr, y); ctx.rotate(-Math.PI / 2); ctx.globalAlpha = 0.8
          ctx.drawImage(speedFx, -4 * dpr, -30 * dpr, 8 * dpr, 60 * dpr)
          ctx.restore(); ctx.globalAlpha = 1
        }
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(Math.PI / 2 + (c.spin > 0 ? (1 - c.spin / 900) * Math.PI * 4 : 0))
        if (img.complete && img.naturalWidth) ctx.drawImage(img, -cw / 2, -ch / 2, cw, ch)
        else { ctx.fillStyle = c.lane === 0 ? '#3B82F6' : '#EF4444'; ctx.fillRect(-cw / 2, -ch / 2, cw, ch) }
        ctx.restore()
        // name tag
        ctx.font = `bold ${12 * dpr}px Fredoka, sans-serif`
        ctx.fillStyle = c.lane === 0 ? '#FDE047' : 'rgba(255,255,255,0.85)'
        ctx.textAlign = 'center'
        ctx.fillText(CAR_NAMES[c.lane], x, y - 34 * dpr)
      }

      // finish detection
      if (anyFinish && !finishedRef.current) {
        finishedRef.current = true
        const order = [...cars].sort((a, b) => b.prog - a.prog)
        const place = order.findIndex(c => c.lane === 0) + 1
        setResult(place)
        if (place === 1) playLevelUp(); else playClick()
        setTimeout(onComplete, 2200)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [started])

  const handleAnswer = (opt: string) => {
    if (answered || result !== null || !round) return
    setChosen(opt); setAnswered(true)
    const player = carsRef.current[0]
    if (opt === round.word) {
      playCorrect(); onCorrect()
      // impulse that integrates to ~BOOST progress with the decay in the loop
      player.vel += BOOST / 170
      setTimeout(() => { setAnswered(false); setChosen(null); setRoundIdx(i => i + 1) }, 450)
    } else {
      playWrong(); onWrong()
      player.spin = 900
      player.vel = 0
      setTimeout(() => { setAnswered(false); setChosen(null); setRoundIdx(i => i + 1) }, 1200)
    }
  }

  if (!started) {
    return (
      <div className="clay-card p-6 max-w-md mx-auto text-center space-y-4">
        <div className="text-6xl">🏎️</div>
        <h2 className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Turbo Word Race</h2>
        <div className="text-clay-text-muted text-base font-semibold space-y-2 text-left">
          <p>🏁 The other cars never stop — be quick!</p>
          <p>👂 Listen to the word and look at the picture.</p>
          <p>⚡ Tap the right word for a TURBO BOOST!</p>
          <p>💫 Wrong word = spin out! Reach the finish first!</p>
        </div>
        <button onClick={() => setStarted(true)} className="clay-button px-8 py-4 text-xl font-extrabold w-full" style={{ fontFamily: 'var(--font-display)' }}>
          🏁 Start Your Engine!
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3">
      <div className="clay-card px-4 py-2 w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          <Flag className="w-5 h-5 text-clay-cta" strokeWidth={2.5} /> Race!
        </div>
        {round && result === null && (
          <div className="flex items-center gap-3">
            <span className="text-4xl">{round.emoji ?? '❔'}</span>
            <button onClick={() => speak(round.word)}
              className="clay-card-interactive flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-clay-text border-3 border-white/80"
              style={{ fontFamily: 'var(--font-display)' }}>
              <Volume2 className="w-6 h-6 text-clay-primary" strokeWidth={2.5} /> Hear it
            </button>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="w-full rounded-2xl border-4 border-white shadow-clay-card"
        style={{ aspectRatio: '16 / 9', maxHeight: '48vh', background: '#475569', touchAction: 'none' }} />
      {result === null && round ? (
        <div className="flex gap-2 justify-center flex-wrap w-full">
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
