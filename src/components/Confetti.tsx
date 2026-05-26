import { useEffect, useState } from 'react'

interface Props {
  duration?: number
}

interface Particle {
  id: number
  x: number
  color: string
  delay: number
  rotation: number
  size: number
  shape: number
}

const COLORS = ['#FF6B6B', '#FECA57', '#48DBFB', '#FF9FF3', '#54A0FF', '#5F27CD', '#01A3A4', '#2ED573', '#FF6348', '#F368E0']
const SHAPES = ['●', '■', '▲', '★', '♦', '♥']

export default function Confetti({ duration = 4000 }: Props) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [active, setActive] = useState(true)

  useEffect(() => {
    const p: Particle[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 2,
      rotation: Math.random() * 360,
      size: 10 + Math.random() * 15,
      shape: Math.floor(Math.random() * SHAPES.length),
    }))
    setParticles(p)
    const t = setTimeout(() => setActive(false), duration)
    return () => clearTimeout(t)
  }, [])

  if (!active) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.x}%`,
            top: '-5%',
            color: p.color,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        >
          {SHAPES[p.shape]}
        </div>
      ))}
    </div>
  )
}
