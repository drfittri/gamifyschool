import { useEffect, useRef, useState } from 'react'
import { playCorrect, playWrong } from '../hooks/useSound'

interface Props {
  words: string[]
  onCorrect: () => void
  onWrong: () => void
  onComplete: () => void
}

const BASE = import.meta.env.BASE_URL
const ASSET = (p: string) => `${BASE}${p.replace(/^\//, '')}`

type Drop = { id: number; x: number; y: number; vy: number; kind: 'fuel' | 'asteroid'; letter: string; sprite: number; r: number }

function pickWords(words: string[], n = 3): string[] {
  const pool = words.filter(w => /^[a-zA-Z]+$/.test(w) && w.length >= 3 && w.length <= 6)
  const src = pool.length ? pool : ['cat', 'dog', 'sun', 'red', 'bat']
  const out: string[] = []
  while (out.length < n) {
    const w = src[Math.floor(Math.random() * src.length)].toLowerCase()
    if (!out.includes(w)) out.push(w)
    if (out.length >= src.length) break
  }
  while (out.length < n) out.push(src[Math.floor(Math.random() * src.length)].toLowerCase())
  return out
}

export default function PhonicsRocket({ words, onCorrect, onWrong, onComplete }: Props) {
  const [started, setStarted] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sessionRef = useRef({
    words: [] as string[],
    wordIdx: 0,
    letterIdx: 0,
    finished: false,
  })
  const [, force] = useState(0)
  const tick = () => force(x => x + 1)

  useEffect(() => {
    if (!started) return
    sessionRef.current = { words: pickWords(words, 3), wordIdx: 0, letterIdx: 0, finished: false }
    tick()

    const cvs = canvasRef.current!
    const ctx = cvs.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const W = (cvs.width = cvs.clientWidth * dpr)
    const H = (cvs.height = cvs.clientHeight * dpr)

    const sprites: Record<string, HTMLImageElement> = {}
    ;['rockets/rocket.png', 'meteors/big.png', 'meteors/med.png', 'meteors/small.png'].forEach(p => {
      const img = new Image(); img.src = ASSET(`assets/${p}`); sprites[p] = img
    })

    const rocket = { x: W / 2, y: H - 80 * dpr, w: 60 * dpr, h: 90 * dpr, flameT: 0 }
    const drops: Drop[] = []
    const stars = Array.from({ length: 100 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 0.4 + Math.random() * 1.5, r: Math.random() * 1.4 + 0.3 }))
    const keys = new Set<string>()
    let touchX: number | null = null
    let nextId = 1
    let spawnTimer = 0
    let last = performance.now()
    let raf = 0

    const spawn = () => {
      const sess = sessionRef.current
      if (sess.finished) return
      const word = sess.words[sess.wordIdx]
      const target = word[sess.letterIdx]
      const isFuel = Math.random() < 0.55
      const letter = isFuel
        ? (Math.random() < 0.5 ? target : 'abcdefghijklmnopqrstuvwxyz'.replace(target, '')[Math.floor(Math.random() * 25)])
        : ''
      drops.push({
        id: nextId++,
        x: 40 * dpr + Math.random() * (W - 80 * dpr),
        y: -40 * dpr,
        vy: (2 + Math.random() * 1.5) * dpr,
        kind: isFuel ? 'fuel' : 'asteroid',
        letter,
        sprite: Math.floor(Math.random() * 3),
        r: isFuel ? 24 * dpr : (24 + Math.random() * 16) * dpr,
      })
    }

    const kd = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault()
      keys.add(e.key)
    }
    const ku = (e: KeyboardEvent) => keys.delete(e.key)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    const onTouch = (e: TouchEvent) => {
      e.preventDefault()
      const r = cvs.getBoundingClientRect()
      const t = e.touches[0]
      if (t) touchX = (t.clientX - r.left) * dpr
    }
    const onTouchEnd = () => { touchX = null }
    cvs.addEventListener('touchstart', onTouch, { passive: false })
    cvs.addEventListener('touchmove', onTouch, { passive: false })
    cvs.addEventListener('touchend', onTouchEnd)

    const draw = (now: number) => {
      const dt = Math.min(40, now - last); last = now

      // bg gradient
      const grd = ctx.createLinearGradient(0, 0, 0, H)
      grd.addColorStop(0, '#06091a'); grd.addColorStop(1, '#1a1340')
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H)
      for (const s of stars) {
        s.y += s.v * (dt / 16)
        if (s.y > H) { s.y = 0; s.x = Math.random() * W }
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill()
      }

      // rocket move
      const speed = 6 * dpr
      if (keys.has('ArrowLeft') || keys.has('a')) rocket.x -= speed
      if (keys.has('ArrowRight') || keys.has('d')) rocket.x += speed
      if (touchX !== null) rocket.x += Math.max(-speed * 1.4, Math.min(speed * 1.4, (touchX - rocket.x) * 0.2))
      rocket.x = Math.max(rocket.w / 2, Math.min(W - rocket.w / 2, rocket.x))

      // flame
      rocket.flameT += dt
      const flameLen = (20 + Math.sin(rocket.flameT / 60) * 8) * dpr
      const fg = ctx.createLinearGradient(0, rocket.y + rocket.h / 2, 0, rocket.y + rocket.h / 2 + flameLen)
      fg.addColorStop(0, '#FBBF24'); fg.addColorStop(1, 'rgba(239,68,68,0)')
      ctx.fillStyle = fg
      ctx.beginPath()
      ctx.moveTo(rocket.x - 12 * dpr, rocket.y + rocket.h / 2)
      ctx.lineTo(rocket.x, rocket.y + rocket.h / 2 + flameLen)
      ctx.lineTo(rocket.x + 12 * dpr, rocket.y + rocket.h / 2)
      ctx.closePath(); ctx.fill()

      // rocket
      const rImg = sprites['rockets/rocket.png']
      if (rImg.complete && rImg.naturalWidth) ctx.drawImage(rImg, rocket.x - rocket.w / 2, rocket.y - rocket.h / 2, rocket.w, rocket.h)
      else { ctx.fillStyle = '#fff'; ctx.fillRect(rocket.x - rocket.w / 2, rocket.y - rocket.h / 2, rocket.w, rocket.h) }

      // spawn
      spawnTimer -= dt
      if (spawnTimer <= 0) {
        spawn()
        spawnTimer = 600 + Math.random() * 500
      }

      // drops
      for (const d of drops) {
        d.y += d.vy * (dt / 16)
        if (d.kind === 'fuel') {
          // capsule
          ctx.save()
          ctx.fillStyle = '#10B981'
          ctx.shadowColor = '#10B981'; ctx.shadowBlur = 12 * dpr
          ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill()
          ctx.shadowBlur = 0
          ctx.fillStyle = 'white'
          ctx.font = `bold ${22 * dpr}px Fredoka, sans-serif`
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(d.letter.toUpperCase(), d.x, d.y + 2 * dpr)
          ctx.restore()
        } else {
          const aImg = sprites[`meteors/${['big', 'med', 'small'][d.sprite]}.png`]
          if (aImg.complete && aImg.naturalWidth) ctx.drawImage(aImg, d.x - d.r, d.y - d.r, d.r * 2, d.r * 2)
          else { ctx.fillStyle = '#8B5E3C'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill() }
        }

        // collide with rocket
        const dx = d.x - rocket.x, dy = d.y - rocket.y
        const dist = Math.hypot(dx, dy)
        if (dist < d.r + rocket.w / 2 - 8 * dpr && d.y < H) {
          const sess = sessionRef.current
          const target = sess.words[sess.wordIdx]?.[sess.letterIdx]
          if (d.kind === 'fuel' && d.letter === target) {
            playCorrect(); onCorrect()
            sess.letterIdx++
            if (sess.letterIdx >= sess.words[sess.wordIdx].length) {
              sess.wordIdx++; sess.letterIdx = 0
              if (sess.wordIdx >= sess.words.length) {
                sess.finished = true
                setTimeout(() => onComplete(), 800)
              }
            }
            tick()
          } else {
            playWrong(); onWrong(); tick()
          }
          d.y = H + 100  // remove
        }
      }
      for (let i = drops.length - 1; i >= 0; i--) if (drops[i].y > H + 50) drops.splice(i, 1)

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
    }
  }, [started])

  const sess = sessionRef.current

  if (showInstructions) {
    return (
      <div className="clay-card p-6 max-w-md mx-auto text-center space-y-4">
        <div className="text-6xl">🚀</div>
        <h2 className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Rocket Launch</h2>
        <div className="text-clay-text-muted text-base font-semibold space-y-2 text-left">
          <p>🟢 Catch <b>green fuel</b> with the correct next letter to spell the word!</p>
          <p>☄️ Dodge the asteroids!</p>
          <p>⬅️ ➡️ Move with arrows or drag</p>
          <p>🌟 Spell 3 words to reach orbit!</p>
        </div>
        <button onClick={() => { setShowInstructions(false); setStarted(true) }} className="clay-button px-8 py-4 text-xl font-extrabold w-full" style={{ fontFamily: 'var(--font-display)' }}>
          🔥 Blast Off!
        </button>
      </div>
    )
  }

  const word = sess.words[sess.wordIdx] || ''
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-3">
      <div className="clay-card px-4 py-2 flex items-center gap-2 text-lg font-extrabold flex-wrap justify-center" style={{ fontFamily: 'var(--font-display)' }}>
        <span className="text-clay-text-muted text-base">Spell:</span>
        {word.split('').map((c, i) => (
          <span key={i} className={`text-2xl px-1 ${i < sess.letterIdx ? 'text-emerald-500' : i === sess.letterIdx ? 'text-clay-cta animate-pulse underline' : 'text-clay-text-muted/60'}`}>
            {c.toUpperCase()}
          </span>
        ))}
        <span className="text-clay-text-muted text-base ml-2">{Math.min(sess.wordIdx + 1, sess.words.length)}/{sess.words.length}</span>
      </div>
      <canvas ref={canvasRef} className="w-full rounded-2xl border-4 border-white shadow-clay-card" style={{ aspectRatio: '3 / 4', maxHeight: '70vh', touchAction: 'none' }} />
      <p className="text-clay-text-muted text-base font-semibold">🟢 Catch the <span className="text-clay-cta font-extrabold">next letter</span> of the word!</p>
    </div>
  )
}
