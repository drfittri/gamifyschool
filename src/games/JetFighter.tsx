import { useEffect, useRef, useState } from 'react'
import { playCorrect, playWrong, playLaser, playExplosion, playPowerup, playComboStreak, playFanfare, playMissionSting, playWarn } from '../hooks/useSound'
import { Crosshair, Ear, Zap, Shield, Swords } from 'lucide-react'
import { loadSprites, drawSprite, drawGlow, drawNebula, drawStarField, makeStarField, Particles, Shaker, Floaters, comboCallout } from './shared/arcade/engine'
import type { SpriteBank } from './shared/arcade/engine'
import { GameHud, MissionBriefing } from './shared/arcade/GameHud'
import { qaExpose, qaPoint } from './shared/qa'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

const SQUADRONS = [
  { words: 2, speed: 1, label: 'SQUADRON 1', sub: 'Enemy patrol ahead!' },
  { words: 2, speed: 1.45, label: 'SQUADRON 2', sub: 'They weave — stay sharp!' },
  { words: 1, speed: 1.6, label: 'WARNING!', sub: 'ACE RED BARON APPROACHING' },
]
const TOTAL_WORDS = SQUADRONS.reduce((s, q) => s + q.words, 0)
const ENEMY_SPRITES = ['enemy1.png', 'enemy2.png', 'enemy3.png']
const FIRE_FRAMES = ['fire00.png', 'fire04.png', 'fire08.png', 'fire12.png', 'fire16.png']

function pickWordsForSession(words: string[], n: number): string[] {
  const pool = words.filter(w => /^[a-zA-Z]+$/.test(w) && w.length >= 2 && w.length <= 7)
  const src = pool.length ? pool : ['cat', 'dog', 'sun', 'bat', 'red']
  const out: string[] = []
  while (out.length < n) {
    const w = src[Math.floor(Math.random() * src.length)].toLowerCase()
    if (out.length === 0 || out[out.length - 1] !== w) out.push(w)
  }
  return out
}

type Enemy = { x: number; y: number; vy: number; letter: string; alive: boolean; sprite: number; angle: number; boss: boolean }
type Bullet = { x: number; y: number; vy: number; alive: boolean; vx: number }

export default function JetFighter({ words, onCorrect, onWrong, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)
  const [hud, setHud] = useState({ wordIdx: 0, letterIdx: 0, score: 0, shields: 3, spread: false })
  const [wordList, setWordList] = useState<string[]>([])

  const sessionRef = useRef({ words: [] as string[], wordIdx: 0, letterIdx: 0, correct: 0, wrong: 0, score: 0, streak: 0, shields: 3, spread: false })
  const fxRef = useRef<{ particles: Particles; shaker: Shaker; floaters: Floaters } | null>(null)

  const startMission = () => { playMissionSting(); setStarted(true) }

  useEffect(() => {
    if (!started) return
    const session = pickWordsForSession(words, TOTAL_WORDS)
    sessionRef.current = { words: session, wordIdx: 0, letterIdx: 0, correct: 0, wrong: 0, score: 0, streak: 0, shields: 3, spread: false }
    setWordList(session)
    setHud({ wordIdx: 0, letterIdx: 0, score: 0, shields: 3, spread: false })

    const cvs = canvasRef.current!
    const ctx = cvs.getContext('2d')!
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = (cvs.width = cvs.clientWidth * dpr)
    const H = (cvs.height = cvs.clientHeight * dpr)

    const bank: SpriteBank = loadSprites([
      'ships/player.png', 'ships/enemy1.png', 'ships/enemy2.png', 'ships/enemy3.png',
      'missiles/laser.png', ...FIRE_FRAMES.map(f => `fx/${f}`),
    ])

    const particles = new Particles()
    const shaker = new Shaker()
    const floaters = new Floaters()
    fxRef.current = { particles, shaker, floaters }
    const stars = makeStarField(W, H, 100)

    const player = { x: W / 2, y: H - 80 * dpr, w: 70 * dpr, h: 80 * dpr }
    const enemies: Enemy[] = []
    const bullets: Bullet[] = []

    let lastShot = 0
    let raf = 0
    let last = performance.now()
    const keys = new Set<string>()

    const squadronOf = (wordIdx: number) => (wordIdx < 2 ? 0 : wordIdx < 4 ? 1 : 2)
    const isBossWord = (wordIdx: number) => squadronOf(wordIdx) === 2

    const spawnWave = () => {
      const sess = sessionRef.current
      if (sess.letterIdx >= sess.words[Math.min(sess.wordIdx, sess.words.length - 1)]?.length) return
      const word = sess.words[Math.min(sess.wordIdx, sess.words.length - 1)]
      if (!word) return
      const target = word[sess.letterIdx]
      const pool = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(c => c !== target)
      const distractors: string[] = []
      while (distractors.length < 3) {
        const c = pool[Math.floor(Math.random() * pool.length)]
        if (!distractors.includes(c)) distractors.push(c)
      }
      const slots = [target, ...distractors].sort(() => Math.random() - 0.5)
      const squadron = squadronOf(sess.wordIdx)
      const speed = (1.4 * dpr) * SQUADRONS[squadron].speed
      const boss = isBossWord(sess.wordIdx)
      const margin = 56 * dpr
      const usable = W - margin * 2
      slots.forEach((letter, i) => {
        const isTarget = letter === target
        enemies.push({
          x: boss && isTarget ? W / 2 : margin + (usable / 3) * i,
          y: boss && isTarget ? 90 * dpr : -50 * dpr - i * 70 * dpr,
          vy: boss && isTarget ? speed * 0.4 : speed,
          letter, alive: true,
          sprite: boss && isTarget ? 2 : Math.floor(Math.random() * 3),
          angle: Math.random() * Math.PI * 2,
          boss: boss && isTarget,
        })
      })
      const bossStep = boss ? sess.letterIdx : -1
      qaExpose({
        game: 'jetfighter',
        phase: boss ? 'boss' : 'playing',
        word,
        options: [word],
        ...(boss ? {} : {}),
      })
      void bossStep
    }

    const shoot = () => {
      const now = performance.now()
      if (now - lastShot < 200) return
      lastShot = now
      playLaser()
      shaker.add(0.05)
      bullets.push({ x: player.x, y: player.y - player.h / 2, vy: -12 * dpr, alive: true, vx: 0 })
      if (sessionRef.current.spread) {
        bullets.push({ x: player.x - 20 * dpr, y: player.y - player.h / 2 + 8 * dpr, vy: -12 * dpr, alive: true, vx: -1.6 * dpr })
        bullets.push({ x: player.x + 20 * dpr, y: player.y - player.h / 2 + 8 * dpr, vy: -12 * dpr, alive: true, vx: 1.6 * dpr })
      }
      // muzzle flash
      particles.burst(player.x, player.y - player.h / 2, { count: 4, colors: ['#FECA57', '#F97316'], speed: 2.5, size: 3, angle: -Math.PI / 2, spread: 0.8, life: 220, grav: 0 })
    }

    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (['ArrowLeft', 'ArrowRight', ' ', 'a', 'd'].includes(e.key)) e.preventDefault()
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
      if (t) { touchX = ((t.clientX - r.left) / r.width) * W; shoot() }
    }
    const onTouchEnd = () => { touchX = null }
    cvs.addEventListener('touchstart', onTouch, { passive: false })
    cvs.addEventListener('touchmove', onTouch, { passive: false })
    cvs.addEventListener('touchend', onTouchEnd)
    const onMouse = (e: MouseEvent) => {
      const r = cvs.getBoundingClientRect()
      touchX = ((e.clientX - r.left) / r.width) * W
      shoot()
    }
    cvs.addEventListener('mousedown', onMouse)

    const finishGame = () => {
      playFanfare()
      floaters.banner('MISSION COMPLETE!', 'All enemy squadrons defeated!')
      qaExpose({ game: 'jetfighter', phase: 'done' })
      setDone(true)
      setTimeout(onComplete, 2800)
    }

    const draw = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now
      const sess = sessionRef.current

      drawNebula(ctx, W, H, now, ['#0b1026', '#172554', '#1E1B4B'])
      drawStarField(ctx, stars, dt, dpr, 1.6)

      ctx.save()
      shaker.update(dt)
      shaker.apply(ctx, dpr)

      // ---- player movement
      const speed = 6 * dpr
      if (keys.has('ArrowLeft') || keys.has('a')) player.x -= speed
      if (keys.has('ArrowRight') || keys.has('d')) player.x += speed
      if (touchX !== null) {
        const diff = touchX - player.x
        player.x += Math.max(-speed * 1.4, Math.min(speed * 1.4, diff * 0.18))
      }
      player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x))
      // banking tilt from movement
      const tilt = touchX !== null ? Math.max(-0.2, Math.min(0.2, (touchX - player.x) * 0.002)) : 0

      // thruster flame
      const flamePath = `fx/${FIRE_FRAMES[Math.floor(now / 60) % FIRE_FRAMES.length]}`
      if (bank.ok(flamePath)) {
        ctx.save()
        ctx.translate(player.x, player.y + player.h / 2 - 6 * dpr)
        ctx.globalAlpha = 0.9
        ctx.drawImage(bank.img(flamePath), -10 * dpr, 0, 20 * dpr, 30 * dpr)
        ctx.restore()
      }
      drawSprite(ctx, bank, 'ships/player.png', player.x, player.y, player.w, player.h, { rot: Math.PI + tilt })

      // ---- bullets
      for (const b of bullets) {
        if (!b.alive) continue
        b.y += b.vy * (dt / 16)
        b.x += (b.vx ?? 0) * (dt / 16)
        if (b.y < -20) b.alive = false
        drawGlow(ctx, b.x, b.y, 10 * dpr, 'rgba(252,202,87,0.8)', 0.45)
        drawSprite(ctx, bank, 'missiles/laser.png', b.x, b.y, 14 * dpr, 32 * dpr)
      }

      // ---- wave management
      if (enemies.every(e => !e.alive || e.y > H + 100) && !done) {
        enemies.length = 0
        spawnWave()
      }

      // ---- enemies
      const word = sess.words[Math.min(sess.wordIdx, sess.words.length - 1)] ?? ''
      const target = word[sess.letterIdx]
      for (const en of enemies) {
        if (!en.alive) continue
        en.y += en.vy * (dt / 16)
        en.angle += 0.02
        const squadron = squadronOf(sess.wordIdx)
        const weave = squadron >= 1 ? Math.sin(en.angle) * (en.boss ? 90 : 50) * dpr : 0
        const ex = en.boss ? W / 2 + Math.sin(en.angle * 0.7) * W * 0.22 : en.x + weave
        const ey = en.y
        const ew = (en.boss ? 96 : 64) * dpr, eh = (en.boss ? 96 : 64) * dpr

        if (en.boss) {
          drawGlow(ctx, ex, ey, ew * 0.95, 'rgba(239,68,68,0.5)', 0.4 + 0.18 * Math.sin(now / 230))
          // boss HP pips = remaining letters
          for (let i = 0; i < word.length; i++) {
            ctx.fillStyle = i < sess.letterIdx ? 'rgba(255,255,255,0.25)' : '#EF4444'
            ctx.beginPath()
            ctx.arc(ex + (i - (word.length - 1) / 2) * 16 * dpr, ey - eh / 2 - 18 * dpr, 5 * dpr, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.font = `900 ${13 * dpr}px Fredoka, sans-serif`
          ctx.fillStyle = '#FCA5A5'
          ctx.textAlign = 'center'
          ctx.fillText('ACE RED BARON', ex, ey - eh / 2 - 32 * dpr)
        }

        ctx.save()
        ctx.translate(ex, ey)
        ctx.rotate(Math.sin(en.angle) * 0.12)
        drawSprite(ctx, bank, `ships/${ENEMY_SPRITES[en.sprite]}`, 0, 0, ew, eh)
        ctx.restore()

        // letter bubble
        ctx.fillStyle = en.boss ? '#FEE2E2' : 'white'
        ctx.beginPath(); ctx.arc(ex, ey, (en.boss ? 24 : 18) * dpr, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = en.boss ? '#B91C1C' : '#111'
        ctx.font = `900 ${(en.boss ? 30 : 22) * dpr}px Fredoka, sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(en.letter.toUpperCase(), ex, ey + 1 * dpr)

        if (en.letter === target) qaPoint(ex / dpr, ey / dpr)

        // bullet hits
        for (const b of bullets) {
          if (!b.alive) continue
          if (Math.abs(b.x - ex) < ew / 2 && Math.abs(b.y - ey) < eh / 2) {
            b.alive = false
            if (en.letter === target) {
              playCorrect(); playExplosion(en.boss ? 0.5 : 0.35); onCorrect()
              sess.correct++
              sess.streak += 1
              sess.score += 10 + Math.min(25, (sess.streak - 1) * 5)
              setHud(h => ({ ...h, score: sess.score, shields: sess.shields, streak: sess.streak, spread: sess.spread, wordIdx: sess.wordIdx, letterIdx: sess.letterIdx }))
              particles.burst(ex, ey, { count: en.boss ? 30 : 22, speed: 7, size: 5, life: 900 })
              particles.ring(ex, ey, en.boss ? '#EF4444' : '#48DBFB', en.boss ? 70 : 40)
              floaters.add(ex, ey - 40 * dpr, 'BOOM!', { color: '#FECA57', size: 22 })
              shaker.add(en.boss ? 0.45 : 0.2)
              sess.letterIdx++
              const callout = comboCallout(sess.streak)
              if (callout) { floaters.banner(callout); playComboStreak(sess.streak) }
              if (sess.streak >= 3 && !sess.spread) {
                sess.spread = true
                setHud(h => ({ ...h, spread: true }))
                playPowerup()
                floaters.banner('SPREAD SHOT!', 'Triple lasers online!')
              }
              if (sess.letterIdx >= word.length) {
                // word complete
                sess.wordIdx++
                sess.letterIdx = 0
                if (sess.wordIdx >= sess.words.length) {
                  en.alive = false
                  finishGame()
                } else {
                  if (isBossWord(sess.wordIdx)) {
                    playWarn()
                    floaters.banner('WARNING!', 'ACE RED BARON APPROACHING')
                  } else {
                    const sq = squadronOf(sess.wordIdx)
                    floaters.banner(SQUADRONS[sq].label, SQUADRONS[sq].sub)
                  }
                  enemies.forEach(e2 => { e2.alive = false })
                }
              } else if (en.boss) {
                floaters.add(ex, ey - 60 * dpr, 'DIRECT HIT!', { color: '#FCA5A5', size: 24 })
              }
              en.alive = false
            } else {
              playWrong(); onWrong(); playWarn()
              sess.wrong++
              sess.streak = 0
              sess.spread = false
              sess.shields = Math.max(0, sess.shields - 1)
              setHud(h => ({ ...h, shields: sess.shields, spread: false }))
              floaters.add(ex, ey - 40 * dpr, 'MISS! SHIELD DOWN', { color: '#FF6B6B', size: 18 })
              particles.burst(ex, ey, { count: 14, colors: ['#94A3B8', '#EF4444'], speed: 5, size: 4, life: 700 })
              en.alive = false
            }
            break
          }
        }

        if (en.y > H + 50) en.alive = false
      }

      particles.update(dt, dpr)
      particles.draw(ctx, dpr)
      floaters.update(dt, dpr)
      floaters.draw(ctx, W, H, dpr)
      ctx.restore()

      raf = requestAnimationFrame(draw)
    }

    spawnWave()
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      cvs.removeEventListener('touchstart', onTouch)
      cvs.removeEventListener('touchmove', onTouch)
      cvs.removeEventListener('touchend', onTouchEnd)
      cvs.removeEventListener('mousedown', onMouse)
      fxRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])

  if (!started) {
    return (
      <MissionBriefing
        title="Jet Strike"
        callsign="Elite Squadron 99"
        hero="✈️"
        gradient="from-sky-950 via-blue-950 to-slate-950"
        orders={[
          { icon: Ear, text: 'Spell the word shown at the top — shoot letters in order!' },
          { icon: Crosshair, text: 'Move: arrow keys or drag. Shoot: SPACE or tap!' },
          { icon: Zap, text: '3 hits in a row = SPREAD SHOT (triple lasers)!' },
          { icon: Shield, text: 'You have 3 shields. Shooting the wrong letter costs one!' },
          { icon: Swords, text: 'Survive 2 squadrons, then down the ACE RED BARON!' },
        ]}
        cta="🛫 Take Off!"
        onStart={startMission}
      />
    )
  }

  const word = wordList[Math.min(sessionRef.current.wordIdx, Math.max(0, wordList.length - 1))] ?? ''
  const letterIdx = sessionRef.current.letterIdx
  const isBoss = sessionRef.current.wordIdx >= 4

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3">
      <GameHud
        statIcon={Swords}
        statLabel={`${hud.score} pts`}
        statColor="text-sky-600"
        shields={hud.shields}
        prompt={null}
        progress={isBoss ? `BOSS · ${word.length - letterIdx} letters left` : `SQ${sessionRef.current.wordIdx < 2 ? 1 : 2} · word ${Math.min(sessionRef.current.wordIdx + 1, TOTAL_WORDS)}/${TOTAL_WORDS}`}
      />
      {/* spelling strip */}
      <div className="clay-card px-4 py-2 flex items-center gap-2 text-lg font-extrabold flex-wrap justify-center" style={{ fontFamily: 'var(--font-display)' }}>
        <span className="text-clay-text-muted text-base">Spell:</span>
        {word.split('').map((c, i) => (
          <span key={i} className={`text-2xl px-1 ${i < letterIdx ? 'text-emerald-500' : i === letterIdx ? 'text-clay-cta animate-pulse underline' : 'text-clay-text-muted/60'}`}>
            {c.toUpperCase()}
          </span>
        ))}
        {hud.spread && <span className="text-orange-500 text-base ml-2 animate-pulse-soft">⚡ SPREAD SHOT</span>}
      </div>
      <canvas ref={canvasRef} className="w-full rounded-2xl border-4 border-white shadow-clay-card" style={{ aspectRatio: '3 / 4', maxHeight: '56vh', background: '#0b1026', touchAction: 'none' }} />
      {!done && <p className="text-clay-text-muted text-base font-semibold text-center">🔫 Shoot the <span className="text-clay-cta font-extrabold">next letter</span> of the word!</p>}
      {done && (
        <div className="clay-card p-5 text-center animate-pop-in">
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Ace defeated — squadron saved!</p>
        </div>
      )}
    </div>
  )
}
