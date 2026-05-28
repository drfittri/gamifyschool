import { useEffect, useRef, useState } from 'react'
import { playCorrect, playWrong, playClick } from '../hooks/useSound'

interface Props {
  words: string[]
  onCorrect: () => void
  onWrong: () => void
  onComplete: () => void
}

const BASE = import.meta.env.BASE_URL
const ASSET = (p: string) => `${BASE}${p.replace(/^\//, '')}`

type Enemy = { x: number; y: number; vy: number; letter: string; alive: boolean; sprite: number; angle: number }
type Bullet = { x: number; y: number; vy: number; alive: boolean }
type Star = { x: number; y: number; v: number; r: number }
type Explosion = { x: number; y: number; t: number }

const ENEMY_SPRITES = ['enemy1.png', 'enemy2.png', 'enemy3.png']

function pickWordsForSession(words: string[], n = 5): string[] {
  const pool = words.filter(w => /^[a-zA-Z]+$/.test(w) && w.length >= 2 && w.length <= 7)
  const src = pool.length ? pool : ['cat', 'dog', 'sun', 'bat', 'red']
  const out: string[] = []
  while (out.length < n) {
    const w = src[Math.floor(Math.random() * src.length)].toLowerCase()
    if (out.length === 0 || out[out.length - 1] !== w) out.push(w)
  }
  return out
}

export default function JetFighter({ words, onCorrect, onWrong, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [started, setStarted] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)

  const sessionRef = useRef({
    words: [] as string[],
    wordIdx: 0,
    letterIdx: 0,
    correct: 0,
    wrong: 0,
    finished: false,
  })
  const [, force] = useState(0)
  const tick = () => force(x => x + 1)

  useEffect(() => {
    if (!started) return
    sessionRef.current = { words: pickWordsForSession(words), wordIdx: 0, letterIdx: 0, correct: 0, wrong: 0, finished: false }
    tick()

    const cvs = canvasRef.current!
    const ctx = cvs.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const W = (cvs.width = cvs.clientWidth * dpr)
    const H = (cvs.height = cvs.clientHeight * dpr)

    const sprites: Record<string, HTMLImageElement> = {}
    ;['ships/player.png', 'ships/enemy1.png', 'ships/enemy2.png', 'ships/enemy3.png', 'missiles/laser.png'].forEach(p => {
      const img = new Image(); img.src = ASSET(`assets/${p}`); sprites[p] = img
    })

    const player = { x: W / 2, y: H - 80 * dpr, w: 70 * dpr, h: 80 * dpr }
    const enemies: Enemy[] = []
    const bullets: Bullet[] = []
    const explosions: Explosion[] = []
    const stars: Star[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H, v: 0.5 + Math.random() * 2, r: Math.random() * 1.5 + 0.3,
    }))

    let lastShot = 0
    const keys = new Set<string>()
    let raf = 0
    let last = performance.now()

    const spawnWave = () => {
      const sess = sessionRef.current
      if (sess.finished) return
      const word = sess.words[sess.wordIdx]
      if (!word) return
      const target = word[sess.letterIdx]
      const pool = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(c => c !== target)
      const distractors: string[] = []
      while (distractors.length < 3) {
        const c = pool[Math.floor(Math.random() * pool.length)]
        if (!distractors.includes(c)) distractors.push(c)
      }
      const slots = [target, ...distractors].sort(() => Math.random() - 0.5)
      const lanes = 4
      const margin = 50 * dpr
      const usable = W - margin * 2
      slots.forEach((letter, i) => {
        enemies.push({
          x: margin + (usable / (lanes - 1)) * i,
          y: -50 * dpr - i * 60 * dpr,
          vy: 1.4 * dpr,
          letter,
          alive: true,
          sprite: Math.floor(Math.random() * 3),
          angle: 0,
        })
      })
    }
    spawnWave()

    const shoot = () => {
      const now = performance.now()
      if (now - lastShot < 220) return
      lastShot = now
      bullets.push({ x: player.x, y: player.y - player.h / 2, vy: -12 * dpr, alive: true })
      playClick()
    }

    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
      if (down) { keys.add(e.key); if (e.key === ' ') shoot() } else keys.delete(e.key)
    }
    const kd = (e: KeyboardEvent) => onKey(e, true)
    const ku = (e: KeyboardEvent) => onKey(e, false)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)

    let touchX: number | null = null
    const onTouch = (e: TouchEvent) => {
      e.preventDefault()
      const r = cvs.getBoundingClientRect()
      const t = e.touches[0]
      if (t) { touchX = (t.clientX - r.left) * dpr; shoot() }
    }
    const onTouchEnd = () => { touchX = null }
    cvs.addEventListener('touchstart', onTouch, { passive: false })
    cvs.addEventListener('touchmove', onTouch, { passive: false })
    cvs.addEventListener('touchend', onTouchEnd)
    const onMouse = (e: MouseEvent) => {
      const r = cvs.getBoundingClientRect()
      touchX = (e.clientX - r.left) * dpr
      shoot()
    }
    cvs.addEventListener('mousedown', onMouse)

    const draw = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now

      ctx.fillStyle = '#0b1026'
      ctx.fillRect(0, 0, W, H)
      for (const s of stars) {
        s.y += s.v * (dt / 16)
        if (s.y > H) { s.y = 0; s.x = Math.random() * W }
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill()
      }

      const speed = 6 * dpr
      if (keys.has('ArrowLeft') || keys.has('a')) player.x -= speed
      if (keys.has('ArrowRight') || keys.has('d')) player.x += speed
      if (touchX !== null) {
        const diff = touchX - player.x
        player.x += Math.max(-speed * 1.4, Math.min(speed * 1.4, diff * 0.18))
      }
      player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x))

      const pimg = sprites['ships/player.png']
      if (pimg.complete && pimg.naturalWidth) {
        ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(Math.PI)
        ctx.drawImage(pimg, -player.w / 2, -player.h / 2, player.w, player.h)
        ctx.restore()
      } else {
        ctx.fillStyle = '#4F46E5'
        ctx.fillRect(player.x - player.w / 2, player.y - player.h / 2, player.w, player.h)
      }

      for (const b of bullets) {
        if (!b.alive) continue
        b.y += b.vy
        if (b.y < -20) b.alive = false
        const limg = sprites['missiles/laser.png']
        if (limg.complete && limg.naturalWidth) ctx.drawImage(limg, b.x - 8 * dpr, b.y - 18 * dpr, 16 * dpr, 36 * dpr)
        else { ctx.fillStyle = '#FECA57'; ctx.fillRect(b.x - 3 * dpr, b.y - 12 * dpr, 6 * dpr, 24 * dpr) }
      }

      if (enemies.every(e => !e.alive || e.y > H + 100) && !sessionRef.current.finished) {
        enemies.length = 0
        spawnWave()
      }

      for (const en of enemies) {
        if (!en.alive) continue
        en.y += en.vy * (dt / 16)
        en.angle += 0.02
        const eimg = sprites[`ships/${ENEMY_SPRITES[en.sprite]}`]
        const ew = 64 * dpr, eh = 64 * dpr
        ctx.save(); ctx.translate(en.x, en.y); ctx.rotate(Math.sin(en.angle) * 0.1)
        if (eimg.complete && eimg.naturalWidth) ctx.drawImage(eimg, -ew / 2, -eh / 2, ew, eh)
        else { ctx.fillStyle = '#EF4444'; ctx.fillRect(-ew / 2, -eh / 2, ew, eh) }
        ctx.fillStyle = 'white'
        ctx.beginPath(); ctx.arc(0, 0, 18 * dpr, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#111'
        ctx.font = `bold ${22 * dpr}px Fredoka, sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(en.letter.toUpperCase(), 0, 2 * dpr)
        ctx.restore()

        for (const b of bullets) {
          if (!b.alive) continue
          if (Math.abs(b.x - en.x) < ew / 2 && Math.abs(b.y - en.y) < eh / 2) {
            b.alive = false
            en.alive = false
            explosions.push({ x: en.x, y: en.y, t: 0 })
            const sess = sessionRef.current
            const target = sess.words[sess.wordIdx][sess.letterIdx]
            if (en.letter === target) {
              playCorrect()
              onCorrect()
              sess.correct++
              sess.letterIdx++
              if (sess.letterIdx >= sess.words[sess.wordIdx].length) {
                sess.wordIdx++
                sess.letterIdx = 0
                if (sess.wordIdx >= sess.words.length) {
                  sess.finished = true
                  setTimeout(() => onComplete(), 800)
                }
              }
              for (const e of enemies) if (e.alive) e.alive = false
              tick()
            } else {
              playWrong()
              onWrong()
              sess.wrong++
              tick()
            }
          }
        }

        if (en.y > H + 50) en.alive = false
      }

      for (const ex of explosions) {
        ex.t += dt
        const r = (ex.t / 8) * dpr
        ctx.fillStyle = `rgba(255,${Math.max(0, 180 - ex.t * 0.3)},0,${Math.max(0, 1 - ex.t / 400)})`
        ctx.beginPath(); ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2); ctx.fill()
      }
      for (let i = explosions.length - 1; i >= 0; i--) if (explosions[i].t > 400) explosions.splice(i, 1)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      cvs.removeEventListener('touchstart', onTouch)
      cvs.removeEventListener('touchmove', onTouch)
      cvs.removeEventListener('touchend', onTouchEnd)
      cvs.removeEventListener('mousedown', onMouse)
    }
  }, [started])

  const sess = sessionRef.current

  if (showInstructions) {
    return (
      <div className="clay-card p-6 max-w-md mx-auto text-center space-y-4">
        <div className="text-6xl">✈️</div>
        <h2 className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Jet Strike</h2>
        <div className="text-clay-text-muted text-base font-semibold space-y-2 text-left">
          <p>🎯 Spell each word by shooting letter-ships <b>in order</b>!</p>
          <p>⬅️ ➡️ Move: Arrow keys or drag finger</p>
          <p>🔫 Shoot: SPACE or tap screen</p>
          <p>🏁 Spell 5 words to win!</p>
        </div>
        <button onClick={() => { setShowInstructions(false); setStarted(true) }} className="clay-button px-8 py-4 text-xl font-extrabold w-full" style={{ fontFamily: 'var(--font-display)' }}>
          🚀 Take Off!
        </button>
      </div>
    )
  }

  const word = sess.words[sess.wordIdx] || ''
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3">
      <div className="clay-card px-4 py-2 flex items-center gap-2 text-lg font-extrabold flex-wrap justify-center" style={{ fontFamily: 'var(--font-display)' }}>
        <span className="text-clay-text-muted text-sm">Spell:</span>
        {word.split('').map((c, i) => (
          <span key={i} className={`text-2xl px-1 ${i < sess.letterIdx ? 'text-emerald-500' : i === sess.letterIdx ? 'text-clay-cta animate-pulse' : 'text-clay-text-muted/40'}`}>
            {i < sess.letterIdx ? c.toUpperCase() : i === sess.letterIdx ? '?' : '_'}
          </span>
        ))}
        <span className="text-clay-text-muted text-sm ml-2">{Math.min(sess.wordIdx + 1, sess.words.length)}/{sess.words.length}</span>
      </div>
      <canvas ref={canvasRef} className="w-full rounded-2xl border-4 border-white shadow-clay-card" style={{ aspectRatio: '3 / 4', maxHeight: '70vh', background: '#0b1026', touchAction: 'none' }} />
      <p className="text-clay-text-muted text-sm font-semibold">Shoot <span className="text-clay-cta font-extrabold">{word[sess.letterIdx]?.toUpperCase() || '✓'}</span></p>
    </div>
  )
}
