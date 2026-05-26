import { BookOpen, ArrowLeft } from 'lucide-react'
import { lessons } from '../data/lessons'
import { GAME_DEFINITIONS } from '../utils/types'
import type { GameDefinition } from '../utils/types'

interface Props {
  onSelectUnit: (unitIndex: number) => void
  onSelectGame: (game: GameDefinition, unitIndex: number) => void
  unitIndex: number | null
}

interface Props {
  onSelectUnit: (unitIndex: number) => void
  onSelectGame: (game: GameDefinition, unitIndex: number) => void
  unitIndex: number | null
}

export default function GamePicker({ onSelectUnit, onSelectGame, unitIndex }: Props) {
  if (unitIndex !== null && unitIndex >= 0) {
    const unit = lessons[unitIndex]
    return (
      <div className="animate-slide-up space-y-5">
        <button onClick={() => onSelectUnit(-1)} className="flex items-center gap-1 text-clay-text-muted hover:text-clay-primary font-bold text-lg transition-colors">
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} /> All Units
        </button>
        <div className="clay-card p-5">
          <span className="inline-block bg-clay-primary-light/20 text-clay-primary font-extrabold text-sm px-3 py-1 rounded-full mb-2">Unit {unit.unit}</span>
          <h2 className="text-3xl font-extrabold text-clay-text mb-2" style={{ fontFamily: 'var(--font-display)' }}>{unit.title}</h2>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {unit.words.slice(0, 8).map(w => (
              <span key={w} className="bg-clay-surface text-clay-text px-2.5 py-1.5 rounded-xl text-sm font-bold">{w}</span>
            ))}
            {unit.words.length > 8 && <span className="bg-clay-surface text-clay-text-muted px-2.5 py-1.5 rounded-xl text-sm font-bold">+{unit.words.length - 8} more</span>}
          </div>
        </div>
        <h3 className="text-xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Pick a Game!</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {GAME_DEFINITIONS.map(game => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game, unitIndex)}
              className="clay-card-interactive p-4 text-center"
            >
              <div className="text-4xl mb-2">{game.emoji}</div>
              <p className="text-clay-text font-extrabold text-base leading-tight" style={{ fontFamily: 'var(--font-display)' }}>{game.title}</p>
              <p className="text-clay-text-muted text-xs mt-1 font-semibold">{game.description}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-slide-up space-y-5">
      <div className="text-center mb-3">
        <div className="clay-card inline-block p-4 mb-3">
          <BookOpen className="w-12 h-12 mx-auto text-clay-primary" strokeWidth={2} />
        </div>
        <h2 className="text-3xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Pick a Lesson!</h2>
        <p className="text-clay-text-muted font-semibold">Choose a unit and start learning!</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {lessons.map((unit, i) => (
          <button
            key={unit.unit}
            onClick={() => onSelectUnit(i)}
            className="clay-card-interactive p-4 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-clay-primary-light/15 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-clay-primary" strokeWidth={2} />
            </div>
            <span className="text-clay-text-muted text-xs font-extrabold">Unit {unit.unit}</span>
            <p className="text-clay-text font-extrabold text-base leading-tight mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{unit.title}</p>
            <span className="text-clay-text-muted/60 text-xs font-semibold">{unit.words.length} words</span>
          </button>
        ))}
      </div>
    </div>
  )
}
