import { BADGES } from '../data/badges'
import { Lock } from 'lucide-react'

interface Props {
  stats: any
}

export default function BadgeGrid({ stats }: Props) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
      {BADGES.map(badge => {
        const earned = badge.conditionMet(stats) || stats.badges.includes(badge.id)
        return (
          <div
            key={badge.id}
            title={`${badge.name}: ${badge.description}`}
            className={`clay-card p-3 text-center transition-all duration-200 ${
              earned ? '' : 'opacity-40 grayscale-[60%]'
            }`}
          >
            <div className="mb-1">
              {earned ? (
                <span className="text-3xl">{badge.icon}</span>
              ) : (
                <Lock className="w-8 h-8 mx-auto text-clay-text-muted/40" strokeWidth={2} />
              )}
            </div>
            <p className={`text-[11px] font-extrabold leading-tight ${earned ? 'text-clay-text' : 'text-clay-text-muted/40'}`}
              style={{ fontFamily: 'var(--font-display)' }}>
              {earned ? badge.name : '???'}
            </p>
          </div>
        )
      })}
    </div>
  )
}
