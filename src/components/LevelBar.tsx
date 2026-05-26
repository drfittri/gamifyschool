import { xpProgress } from '../utils/types'
import { Star } from 'lucide-react'

interface Props {
  xp: number
}

export default function LevelBar({ xp }: Props) {
  const { currentLevel, currentXp, neededXp, percent } = xpProgress(xp)

  return (
    <div className="clay-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="bg-clay-primary text-white text-xs font-extrabold px-3 py-1 rounded-full" style={{ fontFamily: 'var(--font-display)' }}>
            Level {currentLevel}
          </span>
          <Star className="w-4 h-4 text-clay-yellow" strokeWidth={2.5} />
        </div>
        <span className="text-clay-text-muted text-sm font-bold">{xp} XP</span>
      </div>
      <div className="h-5 bg-white/60 rounded-full overflow-hidden relative border-2 border-white">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percent}%`,
            background: 'linear-gradient(90deg, #4F46E5, #818CF8, #F97316)',
          }}
        />
      </div>
      <div className="text-clay-text-muted text-xs mt-1 text-right font-semibold">{currentXp} / {neededXp} XP</div>
    </div>
  )
}
