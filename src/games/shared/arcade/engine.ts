// Shared canvas arcade engine. Every action game sits on this so the
// whole family shares one look: layered parallax scenes, particle
// bursts, screen shake, floating callout text and word pills.
// Positions are in canvas device pixels; speeds are in CSS px per 16ms
// and get multiplied by `scale` (devicePixelRatio) internally.
import { ASSET } from '../wordBank'

export const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const FONT_DISPLAY = 'Fredoka, sans-serif'

// ---------------------------------------------------------------- sprites

export interface SpriteBank {
  img(path: string): HTMLImageElement
  ok(path: string): boolean
}

/** Starts loading the given `assets/...` paths immediately; safe to draw before ready. */
export function loadSprites(paths: string[]): SpriteBank {
  const map = new Map<string, HTMLImageElement>()
  for (const p of paths) {
    const img = new Image()
    img.src = ASSET(p)
    map.set(p, img)
  }
  return {
    img: p => map.get(p)!,
    ok: p => {
      const i = map.get(p)
      return !!i && i.complete && i.naturalWidth > 0
    },
  }
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  bank: SpriteBank,
  path: string,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { rot?: number; alpha?: number; fallback?: string } = {},
) {
  ctx.save()
  ctx.translate(x, y)
  if (opts.rot) ctx.rotate(opts.rot)
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha
  if (bank.ok(path)) {
    ctx.drawImage(bank.img(path), -w / 2, -h / 2, w, h)
  } else {
    ctx.fillStyle = opts.fallback ?? '#94A3B8'
    ctx.beginPath()
    ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.25)
    ctx.fill()
  }
  ctx.restore()
}

/** Soft glow behind a sprite/point (drawn before the sprite). */
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha = 0.45,
) {
  if (REDUCED_MOTION) return
  ctx.save()
  ctx.globalAlpha = alpha
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, color)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ---------------------------------------------------------------- particles

interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; decay: number
  size: number; color: string
  kind: 'circle' | 'star' | 'shard' | 'ring' | 'smoke'
  rot: number; vr: number; grav: number
  maxLife: number
}

export interface BurstOpts {
  count?: number
  colors?: string[]
  speed?: number      // css px / 16ms
  size?: number       // css px
  grav?: number
  life?: number       // ms
  spread?: number     // radians; default full circle
  angle?: number      // center direction when spread < 2π
}

const DEFAULT_COLORS = ['#FECA57', '#FF6B6B', '#48DBFB', '#1DD1A1', '#F97316']

export class Particles {
  private ps: Particle[] = []
  private cap: number
  constructor(cap = 420) {
    this.cap = cap
  }

  get count() { return this.ps.length }

  burst(x: number, y: number, o: BurstOpts = {}) {
    if (REDUCED_MOTION) return
    const { count = 18, colors = DEFAULT_COLORS, speed = 6, size = 5, grav = 0.14, life = 900, spread = Math.PI * 2, angle = 0 } = o
    const n = Math.min(count, this.cap - this.ps.length)
    for (let i = 0; i < n; i++) {
      const a = spread >= Math.PI * 2 ? Math.random() * Math.PI * 2 : angle + (Math.random() - 0.5) * spread
      const v = speed * (0.35 + Math.random() * 0.85)
      const kind = (['circle', 'star', 'shard'] as const)[Math.floor(Math.random() * 3)]
      this.ps.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life, decay: life * (0.7 + Math.random() * 0.5),
        size: size * (0.5 + Math.random() * 0.9), color: colors[i % colors.length],
        kind, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.25,
        grav, maxLife: life,
      })
    }
  }

  /** Expanding shockwave ring (boss hits, explosions). */
  ring(x: number, y: number, color = '#FECA57', maxR = 60, life = 420) {
    if (REDUCED_MOTION) return
    if (this.ps.length >= this.cap) this.ps.shift()
    this.ps.push({ x, y, vx: 0, vy: 0, life, decay: life, size: maxR, color, kind: 'ring', rot: 0, vr: 0, grav: 0, maxLife: life })
  }

  smoke(x: number, y: number, size = 8, life = 900, drift = 0.4) {
    if (REDUCED_MOTION) return
    if (this.ps.length >= this.cap) this.ps.shift()
    this.ps.push({
      x, y, vx: (Math.random() - 0.5) * drift, vy: -0.3 - Math.random() * 0.4,
      life, decay: life, size, color: 'rgba(229,231,235,0.7)', kind: 'smoke',
      rot: 0, vr: 0, grav: -0.01, maxLife: life,
    })
  }

  update(dt: number, scale: number) {
    const k = (dt / 16) * scale
    for (const p of this.ps) {
      p.x += p.vx * k
      p.y += p.vy * k
      p.vy += p.grav * k
      p.rot += p.vr * k
      p.life -= dt
    }
    this.ps = this.ps.filter(p => p.life > 0)
  }

  draw(ctx: CanvasRenderingContext2D, scale: number) {
    for (const p of this.ps) {
      const t = Math.max(0, p.life / p.maxLife)
      ctx.save()
      ctx.globalAlpha = p.kind === 'smoke' ? t * 0.55 : t
      if (p.kind === 'ring') {
        const r = p.size * (1.15 - t) * scale
        ctx.strokeStyle = p.color
        ctx.lineWidth = 4 * scale * t
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.stroke()
      } else if (p.kind === 'smoke') {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (1.7 - t * 0.7) * scale, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        const s = p.size * scale
        if (p.kind === 'star') {
          ctx.beginPath()
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2
            const a2 = a + Math.PI / 5
            ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s)
            ctx.lineTo(Math.cos(a2) * s * 0.45, Math.sin(a2) * s * 0.45)
          }
          ctx.closePath()
          ctx.fill()
        } else if (p.kind === 'shard') {
          ctx.fillRect(-s / 2, -s / 4, s, s / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.restore()
    }
  }

  clear() { this.ps = [] }
}

// ---------------------------------------------------------------- screen shake

export class Shaker {
  private trauma = 0
  add(amount: number) {
    if (REDUCED_MOTION) return
    this.trauma = Math.min(1, this.trauma + amount)
  }
  update(dt: number) {
    this.trauma = Math.max(0, this.trauma - dt / 650)
  }
  /** Apply the shake; call ctx.restore() via the returned helper pattern (use with ctx.save()). */
  apply(ctx: CanvasRenderingContext2D, scale: number) {
    if (this.trauma <= 0) return
    const m = this.trauma * this.trauma
    ctx.translate(
      (Math.random() - 0.5) * 2 * 14 * m * scale,
      (Math.random() - 0.5) * 2 * 10 * m * scale,
    )
  }
  get active() { return this.trauma > 0 }
}

// ---------------------------------------------------------------- floating text

export interface Floater {
  x: number; y: number
  text: string
  color: string
  size: number      // css px
  life: number; maxLife: number
  vy: number
  big?: boolean
  sub?: boolean     // banner sub-line (drawn below the main banner)
}

export class Floaters {
  private fs: Floater[] = []

  add(x: number, y: number, text: string, o: Partial<Floater> = {}) {
    const life = o.life ?? 800
    this.fs.push({
      x, y, text,
      color: o.color ?? '#fff',
      size: o.size ?? 20,
      life, maxLife: life,
      vy: o.vy ?? -0.8,
      big: o.big,
    })
  }

  /** Wave/boss banner: big centered text that pops in, holds and fades. */
  banner(text: string, sub?: string) {
    this.fs.push({ x: -1, y: -1, text, color: '#FECA57', size: 52, life: 1600, maxLife: 1600, vy: 0, big: true })
    if (sub) {
      this.fs.push({ x: -1, y: -1, text: sub, color: '#fff', size: 24, life: 1600, maxLife: 1600, vy: 0, big: true, sub: true })
    }
  }

  update(dt: number, scale: number) {
    for (const f of this.fs) {
      if (!f.big) {
        f.y += f.vy * (dt / 16) * scale
      }
      f.life -= dt
    }
    this.fs = this.fs.filter(f => f.life > 0)
  }

  draw(ctx: CanvasRenderingContext2D, W: number, H: number, scale: number) {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const f of this.fs) {
      const t = f.life / f.maxLife
      ctx.save()
      if (f.big) {
        // pop-in overshoot then fade
        const inT = 1 - Math.max(0, (f.life - f.maxLife * 0.82) / (f.maxLife * 0.18))
        const pop = inT < 1 ? 0.6 + 0.4 * (1 + Math.sin(inT * Math.PI - Math.PI / 2)) : 1
        const alpha = Math.min(1, f.life / (f.maxLife * 0.3))
        ctx.globalAlpha = alpha
        ctx.translate(W / 2, H * (f.sub ? 0.47 : 0.38))
        ctx.scale(pop, pop)
        ctx.font = `900 ${(f.sub ? f.size : f.size) * scale}px ${FONT_DISPLAY}`
        ctx.lineWidth = 8 * scale
        ctx.strokeStyle = 'rgba(30,27,75,0.9)'
        ctx.strokeText(f.text, 0, 0)
        ctx.fillStyle = f.color
        ctx.fillText(f.text, 0, 0)
      } else {
        ctx.globalAlpha = Math.min(1, t * 1.6)
        ctx.font = `900 ${f.size * scale}px ${FONT_DISPLAY}`
        ctx.lineWidth = 5 * scale
        ctx.strokeStyle = 'rgba(30,27,75,0.85)'
        ctx.strokeText(f.text, f.x, f.y)
        ctx.fillStyle = f.color
        ctx.fillText(f.text, f.x, f.y)
      }
      ctx.restore()
    }
  }
}

// ---------------------------------------------------------------- word pill

export type PillState = 'idle' | 'right' | 'wrong'

/** Rounded pill carrying a word under a sprite. Returns pill top y. */
export function wordPill(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  text: string,
  scale: number,
  state: PillState = 'idle',
  fontPx = 17,
): number {
  ctx.font = `bold ${fontPx * scale}px ${FONT_DISPLAY}`
  const tw = ctx.measureText(text).width
  const pw = Math.max(tw + 24 * scale, 52 * scale)
  const ph = 30 * scale
  const x = cx - pw / 2
  ctx.save()
  ctx.shadowColor = 'rgba(30,27,75,0.35)'
  ctx.shadowBlur = 6 * scale
  ctx.shadowOffsetY = 3 * scale
  ctx.fillStyle = state === 'right' ? '#22C55E' : state === 'wrong' ? '#EF4444' : 'rgba(255,255,255,0.96)'
  ctx.beginPath()
  ctx.roundRect(x, topY, pw, ph, ph / 2)
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = state === 'idle' ? '#1E1B4B' : '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cx, topY + ph / 2 + 1 * scale)
  return topY
}

// ---------------------------------------------------------------- parallax helpers

export interface StarLayer { x: number; y: number; r: number; tw: number; v: number }

export function makeStarField(W: number, H: number, n: number): StarLayer[] {
  return Array.from({ length: n }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: (0.4 + Math.random() * 1.5),
    tw: Math.random() * Math.PI * 2,
    v: 0.2 + Math.random() * 1.4,
  }))
}

export function drawStarField(
  ctx: CanvasRenderingContext2D,
  stars: StarLayer[],
  dt: number,
  scale: number,
  speedMul = 1,
) {
  for (const s of stars) {
    s.tw += dt * 0.003
    s.y += s.v * speedMul * (dt / 16) * scale
    if (s.y > ctx.canvas.height) { s.y = -2; s.x = Math.random() * ctx.canvas.width }
    ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.45 * Math.sin(s.tw)})`
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r * scale, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Space nebula backdrop: dark gradient + tinted blobs. */
export function drawNebula(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, colors: [string, string, string]) {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, colors[0])
  g.addColorStop(0.65, colors[1])
  g.addColorStop(1, colors[2])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  if (REDUCED_MOTION) return
  ctx.save()
  ctx.globalAlpha = 0.12
  for (let i = 0; i < 3; i++) {
    const bx = W * (0.25 + 0.3 * i) + Math.sin(t / 4000 + i * 2) * W * 0.05
    const by = H * (0.3 + 0.22 * ((i + 1) % 3)) + Math.cos(t / 5200 + i) * H * 0.04
    const r = Math.min(W, H) * (0.28 + 0.1 * i)
    const rg = ctx.createRadialGradient(bx, by, 0, bx, by, r)
    rg.addColorStop(0, i % 2 ? '#7C3AED' : '#0EA5E9')
    rg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = rg
    ctx.beginPath()
    ctx.arc(bx, by, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** Big shaded planet with ring option (space scenes). */
export function drawPlanet(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  base: string, shade: string,
  ring?: string,
) {
  ctx.save()
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.15, x, y, r)
  g.addColorStop(0, base)
  g.addColorStop(1, shade)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  if (ring) {
    ctx.strokeStyle = ring
    ctx.lineWidth = r * 0.12
    ctx.globalAlpha = 0.6
    ctx.beginPath()
    ctx.ellipse(x, y, r * 1.5, r * 0.4, -0.35, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

// ---------------------------------------------------------------- misc

export const COMBO_CALLOUTS: [number, string][] = [
  [3, 'TRIPLE BLAST!'],
  [4, 'QUAD POWER!'],
  [5, 'MEGA STREAK!'],
  [6, 'UNSTOPPABLE!'],
  [8, 'LEGENDARY!!'],
]

export function comboCallout(streak: number): string | null {
  let out: string | null = null
  for (const [n, text] of COMBO_CALLOUTS) if (streak >= n) out = text
  return out
}

/** Scoring: 10 base, +5 per current streak step (caps at +25), doubled during boss. */
export function roundScore(streak: number, boss = false): number {
  const s = 10 + Math.min(25, Math.max(0, streak - 1) * 5)
  return boss ? s * 2 : s
}
