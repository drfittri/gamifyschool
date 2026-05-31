import type { MathQuestion } from '../../data/math'
import { SHAPES_2D, SHAPES_3D } from '../../data/math'

/* Shared visual renderer for a question's `display` field.
   The generic games (shooter / race / rocket / count) reused one question set
   across every unit but printed `display` as raw text — so a shape rendered as
   the English code word "square", a fraction as the literal "1/3" (with nothing
   shaded), a clock time as digital "9:00", and a pictograph string was hidden.
   QDisplay draws the right picture so every question type is answerable. */

const SHAPE_SET = new Set([...SHAPES_2D, ...SHAPES_3D])

function ShapeGlyph({ name, size = 130 }: { name: string; size?: number }) {
  const s = size, c = s / 2
  switch (name) {
    case 'circle': return <svg width={s} height={s}><circle cx={c} cy={c} r={c - 6} fill="#ff6b6b" stroke="#fff" strokeWidth="4" /></svg>
    case 'square': return <svg width={s} height={s}><rect x="6" y="6" width={s - 12} height={s - 12} fill="#48dbfb" stroke="#fff" strokeWidth="4" /></svg>
    case 'rectangle': return <svg width={s} height={s}><rect x="6" y="22" width={s - 12} height={s - 44} fill="#feca57" stroke="#fff" strokeWidth="4" /></svg>
    case 'triangle': return <svg width={s} height={s}><polygon points={`${c},6 ${s - 6},${s - 6} 6,${s - 6}`} fill="#1dd1a1" stroke="#fff" strokeWidth="4" /></svg>
    case 'star': {
      const pts: string[] = []
      for (let i = 0; i < 10; i++) {
        const angle = (i * 36 - 90) * Math.PI / 180
        const rad = i % 2 === 0 ? c - 6 : c / 2.4
        pts.push(`${c + Math.cos(angle) * rad},${c + Math.sin(angle) * rad}`)
      }
      return <svg width={s} height={s}><polygon points={pts.join(' ')} fill="#ff9ff3" stroke="#fff" strokeWidth="3" /></svg>
    }
    case 'heart': return <svg width={s} height={s} viewBox="0 0 100 100"><path d="M50,82 C20,60 15,30 35,25 C45,22 50,32 50,38 C50,32 55,22 65,25 C85,30 80,60 50,82 Z" fill="#ee5253" stroke="#fff" strokeWidth="3" /></svg>
    case 'cube': return (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <polygon points="20,30 50,15 80,30 80,70 50,85 20,70" fill="#5f27cd" stroke="#fff" strokeWidth="2" />
        <polygon points="20,30 50,45 80,30" fill="#341f7a" stroke="#fff" strokeWidth="2" />
        <polygon points="50,45 50,85 80,70 80,30" fill="#4527a0" stroke="#fff" strokeWidth="2" />
      </svg>
    )
    case 'sphere': return (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <defs><radialGradient id="qsph" cx="0.35" cy="0.35"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="#ff6b6b" /></radialGradient></defs>
        <circle cx="50" cy="50" r="40" fill="url(#qsph)" stroke="#fff" strokeWidth="2" />
      </svg>
    )
    case 'cone': return (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <polygon points="50,15 20,80 80,80" fill="#feca57" stroke="#fff" strokeWidth="2" />
        <ellipse cx="50" cy="80" rx="30" ry="8" fill="#d4a73e" stroke="#fff" strokeWidth="2" />
      </svg>
    )
    case 'cylinder': return (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <rect x="25" y="25" width="50" height="55" fill="#48dbfb" stroke="#fff" strokeWidth="2" />
        <ellipse cx="50" cy="25" rx="25" ry="8" fill="#2e86de" stroke="#fff" strokeWidth="2" />
        <ellipse cx="50" cy="80" rx="25" ry="8" fill="#48dbfb" stroke="#fff" strokeWidth="2" />
      </svg>
    )
    case 'pyramid': return (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <polygon points="50,15 20,80 80,80" fill="#1dd1a1" stroke="#fff" strokeWidth="2" />
        <polygon points="50,15 80,80 65,85" fill="#0f8a6a" stroke="#fff" strokeWidth="2" />
      </svg>
    )
    default: return <div className="text-6xl">❓</div>
  }
}

function FractionPie({ num, den, size = 130 }: { num: number; den: number; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 8
  const slices = []
  for (let i = 0; i < den; i++) {
    const a0 = (i / den) * Math.PI * 2 - Math.PI / 2
    const a1 = ((i + 1) / den) * Math.PI * 2 - Math.PI / 2
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0)
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
    const large = a1 - a0 > Math.PI ? 1 : 0
    slices.push(
      <path key={i} d={`M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z`}
        fill={i < num ? '#ff6b6b' : '#fff'} stroke="#c0392b" strokeWidth="2.5" />
    )
  }
  return <svg width={size} height={size}>{slices}</svg>
}

function ClockGlyph({ time, size = 150 }: { time: string; size?: number }) {
  const m = time.match(/(\d+):(\d+)/)
  if (!m) return null
  const h = parseInt(m[1]), mins = parseInt(m[2])
  const hourAngle = ((h % 12) + mins / 60) * 30 - 90
  const minAngle = mins * 6 - 90
  const cx = 120, cy = 120, r = 100
  const hx = cx + Math.cos(hourAngle * Math.PI / 180) * r * 0.55
  const hy = cy + Math.sin(hourAngle * Math.PI / 180) * r * 0.55
  const mx = cx + Math.cos(minAngle * Math.PI / 180) * r * 0.8
  const my = cy + Math.sin(minAngle * Math.PI / 180) * r * 0.8
  return (
    <svg width={size} height={size} viewBox="0 0 240 240">
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke="#37474f" strokeWidth="6" />
      {[...Array(12)].map((_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180
        const x = cx + Math.cos(a) * r * 0.85
        const y = cy + Math.sin(a) * r * 0.85
        return <text key={i} x={x} y={y + 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#37474f">{i === 0 ? 12 : i}</text>
      })}
      <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#37474f" strokeWidth="7" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={mx} y2={my} stroke="#d32f2f" strokeWidth="4" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="#37474f" />
    </svg>
  )
}

function CompareBars({ a, b }: { a: number; b: number }) {
  const maxv = Math.max(a, b, 1)
  return (
    <div className="flex items-end justify-center gap-8">
      <div className="flex flex-col items-center">
        <div className="bg-blue-400 rounded-t-lg w-16" style={{ height: 30 + (a / maxv) * 110 }} />
        <span className="text-2xl font-extrabold text-white mt-1">A</span>
      </div>
      <div className="flex flex-col items-center">
        <div className="bg-orange-400 rounded-t-lg w-16" style={{ height: 30 + (b / maxv) * 110 }} />
        <span className="text-2xl font-extrabold text-white mt-1">B</span>
      </div>
    </div>
  )
}

function Pictograph({ rows }: { rows: string[] }) {
  return (
    <div className="flex flex-col gap-1 text-3xl">
      {rows.map((r, i) => <div key={i} className="whitespace-nowrap">{r.trim()}</div>)}
    </div>
  )
}

/* Decide which visual a question needs from its prompt + display string. */
export default function QDisplay({ q }: { q: MathQuestion }) {
  const d = q.display
  if (!d) return null

  // shape: display is an English shape key
  if (SHAPE_SET.has(d)) return <ShapeGlyph name={d} />

  // fraction: "n/d"
  const f = d.match(/^(\d+)\/(\d+)$/)
  if (f) return <FractionPie num={parseInt(f[1])} den={parseInt(f[2])} />

  // clock time: "h:mm" (only when the prompt is asking about the time shown)
  if (/^\d{1,2}:\d{2}$/.test(d) && /waktu|jam/i.test(q.prompt)) return <ClockGlyph time={d} />

  // compare: "5|3", "5vs3", "5~3"
  const c = d.match(/^(\d+)\s*[|~]\s*(\d+)$/) || d.match(/^(\d+)vs(\d+)$/)
  if (c) return <CompareBars a={parseInt(c[1])} b={parseInt(c[2])} />

  // pictograph: emoji rows separated by "|"
  if (d.includes('|')) return <Pictograph rows={d.split('|')} />

  // counting / plain emoji or short text
  return <div className="flex flex-wrap items-center justify-center gap-1 leading-relaxed" style={{ fontSize: 34 }}>{d}</div>
}
