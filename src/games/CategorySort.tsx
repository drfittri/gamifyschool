import { useMemo, useState, useRef, useEffect } from 'react'
import { lessons } from '../data/lessons'
import { playCorrect, playWrong } from '../hooks/useSound'

interface Props {
  words: string[]
  onCorrect: () => void
  onWrong: () => void
  onComplete: () => void
}

const BASE = import.meta.env.BASE_URL
const ASSET = (p: string) => `${BASE}${p.replace(/^\//, '')}`

const TANK_SPRITES = ['tanks/blue.png', 'tanks/green.png', 'tanks/grey.png', 'tanks/desert.png']
const CAT_TANK: Record<string, string> = {}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}

interface Category { name: string; emoji: string; words: string[] }
function buildCategories(): Category[] {
  const all: Record<string, string[]> = {}
  for (const l of lessons) {
    const cat = l.title
    if (!all[cat]) all[cat] = []
    for (const w of l.words) if (!all[cat].includes(w)) all[cat].push(w)
  }
  const titles: Record<string, string> = {
    'My Body': 'Body', 'Colours': 'Colours', 'Animals': 'Animals', 'My Classroom': 'School',
    'Food & Drinks': 'Food', 'Clothes': 'Clothes', 'Toys & Play': 'Toys', 'My Family': 'Family',
  }
  const emojis: Record<string, string> = {
    'My Body': '🧍', 'Colours': '🎨', 'Animals': '🐾', 'My Classroom': '🏫',
    'Food & Drinks': '🍔', 'Clothes': '👕', 'Toys & Play': '🎲', 'My Family': '👪',
  }
  const cats: Category[] = []
  for (const [key, ws] of Object.entries(all)) {
    if (titles[key] && ws.length >= 5) cats.push({ name: titles[key], emoji: emojis[key], words: ws })
  }
  return cats
}

interface Recruit { id: number; word: string; category: string; tank: string }

export default function CategorySort({ onCorrect, onWrong, onComplete }: Props) {
  const [showInstructions, setShowInstructions] = useState(true)
  const recruitData = useMemo(() => {
    const cats = shuffle(buildCategories()).slice(0, 3)
    cats.forEach((c, i) => { CAT_TANK[c.name] = TANK_SPRITES[i % TANK_SPRITES.length] })
    // a word that appears in more than one shown category would be ambiguous — drop it
    const counts: Record<string, number> = {}
    for (const c of cats) for (const w of c.words) counts[w] = (counts[w] || 0) + 1
    const pool: Recruit[] = []
    let id = 1
    for (const c of cats) {
      const unique = c.words.filter(w => counts[w] === 1)
      for (const w of shuffle(unique).slice(0, 3)) {
        pool.push({ id: id++, word: w, category: c.name, tank: CAT_TANK[c.name] })
      }
    }
    return { recruits: shuffle(pool), categories: cats }
  }, [])

  const [queue] = useState<Recruit[]>(recruitData.recruits)
  const [deployed, setDeployed] = useState<number[]>([])
  const [feedback, setFeedback] = useState<{ id: number; ok: boolean } | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const dropZones = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (deployed.length > 0 && deployed.length === recruitData.recruits.length) {
      setTimeout(() => onComplete(), 800)
    }
  }, [deployed])

  const current = queue.find(r => !deployed.includes(r.id))

  const handleDrop = (cat: string) => {
    if (!current) return
    if (cat === current.category) {
      playCorrect(); onCorrect()
      setFeedback({ id: current.id, ok: true })
      setTimeout(() => { setDeployed(d => [...d, current.id]); setFeedback(null) }, 500)
    } else {
      playWrong(); onWrong()
      setFeedback({ id: current.id, ok: false })
      setTimeout(() => setFeedback(null), 500)
    }
    setDragging(null)
  }

  // pointer-based drag (works on touch + mouse)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const [tankPos, setTankPos] = useState({ x: 0, y: 0 })
  const tankRef = useRef<HTMLDivElement>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    if (!current || feedback) return
    setDragging(current.id)
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
    setTankPos({ x: 0, y: 0 })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging === null || !pointerStartRef.current) return
    setTankPos({ x: e.clientX - pointerStartRef.current.x, y: e.clientY - pointerStartRef.current.y })
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragging === null) return
    const x = e.clientX, y = e.clientY
    let hit: string | null = null
    for (const cat of recruitData.categories) {
      const el = dropZones.current[cat.name]
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) { hit = cat.name; break }
    }
    if (hit) handleDrop(hit)
    else { setDragging(null); setTankPos({ x: 0, y: 0 }) }
  }

  if (showInstructions) {
    return (
      <div className="clay-card p-6 max-w-md mx-auto text-center space-y-4">
        <div className="text-6xl">🪖</div>
        <h2 className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Army Barracks</h2>
        <div className="text-clay-text-muted text-base font-semibold space-y-2 text-left">
          <p>🚜 Drag each recruit-tank into the correct battalion base.</p>
          <p>🎯 Match the word to the right category (Animals, Food, etc.).</p>
          <p>🏆 Deploy all recruits to complete the mission!</p>
        </div>
        <button onClick={() => setShowInstructions(false)} className="clay-button px-8 py-4 text-xl font-extrabold w-full" style={{ fontFamily: 'var(--font-display)' }}>
          🎖️ Begin Deployment!
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      <div className="clay-card px-4 py-2 text-center">
        <p className="text-sm text-clay-text-muted font-bold">Deployed: {deployed.length}/{recruitData.recruits.length}</p>
        <div className="flex gap-1 justify-center mt-1">
          {recruitData.recruits.map(r => (
            <span key={r.id} className={`w-2.5 h-2.5 rounded-full ${deployed.includes(r.id) ? 'bg-emerald-500' : 'bg-clay-text-muted/20'}`} />
          ))}
        </div>
      </div>

      {/* Battalion bases */}
      <div className="grid grid-cols-3 gap-2">
        {recruitData.categories.map(cat => (
          <div
            key={cat.name}
            ref={(el) => { dropZones.current[cat.name] = el }}
            className={`clay-card p-3 text-center min-h-[100px] flex flex-col items-center justify-center gap-1 border-3 ${dragging ? 'border-clay-cta animate-pulse' : 'border-white/80'}`}
          >
            <div className="text-3xl">{cat.emoji}</div>
            <p className="text-sm font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>{cat.name}</p>
            <img src={ASSET(`assets/${CAT_TANK[cat.name]}`)} alt="" className="w-8 h-8 opacity-50" onError={(e) => (e.currentTarget.style.display = 'none')} />
          </div>
        ))}
      </div>

      {/* Recruit area */}
      <div className="clay-card p-6 min-h-[220px] flex flex-col items-center justify-center gap-3 relative" style={{ background: 'linear-gradient(to bottom, #FEF3C7, #D6D3D1)' }}>
        {current ? (
          <>
            <p className="text-clay-text-muted text-sm font-bold">Drag this recruit to its battalion:</p>
            <div
              ref={tankRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className={`cursor-grab active:cursor-grabbing select-none touch-none transition-transform ${feedback?.ok ? 'animate-bounce-in' : feedback ? 'animate-wiggle' : ''}`}
              style={{
                transform: `translate(${tankPos.x}px, ${tankPos.y}px) ${dragging ? 'scale(1.1)' : 'scale(1)'}`,
                touchAction: 'none',
              }}
            >
              <img src={ASSET(`assets/${current.tank}`)} alt={current.word} className="w-20 h-20 mx-auto pointer-events-none" style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.3))' }} />
              <p className="mt-2 text-2xl font-extrabold text-clay-text text-center pointer-events-none" style={{ fontFamily: 'var(--font-display)' }}>
                {current.word}
              </p>
            </div>
          </>
        ) : (
          <p className="text-2xl font-extrabold text-emerald-600" style={{ fontFamily: 'var(--font-display)' }}>🎖️ All deployed!</p>
        )}
      </div>
    </div>
  )
}
