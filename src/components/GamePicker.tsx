import { ArrowLeft } from 'lucide-react'
import { lessons } from '../data/lessons'
import { GAME_DEFINITIONS } from '../utils/types'
import type { GameDefinition } from '../utils/types'

interface Props {
  onSelectUnit: (unitIndex: number) => void
  onSelectGame: (game: GameDefinition, unitIndex: number) => void
  unitIndex: number | null
}

const UNIT_EMOJI: Record<string, string> = {
  'Hello!': '👋',
  'My Body': '🧍',
  'My Family': '👨‍👩‍👧',
  'Colours': '🎨',
  'Animals': '🐾',
  'My Classroom': '🏫',
  'Food & Drinks': '🍎',
  'Clothes': '👗',
  'Toys & Play': '🎮',
  'Numbers': '🔢',
  'Actions': '🏃',
  'Greetings': '😊',
}

const UNIT_BG: string[] = [
  'bg-rose-100', 'bg-blue-100', 'bg-amber-100', 'bg-purple-100',
  'bg-green-100', 'bg-orange-100', 'bg-pink-100', 'bg-teal-100',
  'bg-indigo-100', 'bg-yellow-100', 'bg-lime-100', 'bg-cyan-100',
]

const UNIT_BORDER: string[] = [
  'border-rose-300', 'border-blue-300', 'border-amber-300', 'border-purple-300',
  'border-green-300', 'border-orange-300', 'border-pink-300', 'border-teal-300',
  'border-indigo-300', 'border-yellow-300', 'border-lime-300', 'border-cyan-300',
]

export default function GamePicker({ onSelectUnit, onSelectGame, unitIndex }: Props) {
  if (unitIndex !== null && unitIndex >= 0) {
    const unit = lessons[unitIndex]
    const unitEmoji = UNIT_EMOJI[unit.title] || '📚'
    return (
      <div className="animate-slide-up space-y-5">
        <button onClick={() => onSelectUnit(-1)} className="flex items-center gap-1 text-clay-text-muted hover:text-clay-primary font-bold text-lg transition-colors">
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} /> All Units
        </button>
        <div className={`clay-card p-5 border-3 ${UNIT_BORDER[unitIndex % UNIT_BORDER.length]}`}>
          <span className="inline-block bg-clay-primary-light/20 text-clay-primary font-extrabold text-sm px-3 py-1 rounded-full mb-2">Unit {unit.unit}</span>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-5xl">{unitEmoji}</span>
            <h2 className="text-3xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>{unit.title}</h2>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {unit.words.slice(0, 8).map(w => (
              <span key={w} className="bg-clay-surface text-clay-text px-2.5 py-1.5 rounded-xl text-sm font-bold">{w}</span>
            ))}
            {unit.words.length > 8 && <span className="bg-clay-surface text-clay-text-muted px-2.5 py-1.5 rounded-xl text-sm font-bold">+{unit.words.length - 8} more</span>}
          </div>
        </div>
        <h3 className="text-xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>🎮 Pick a Game!</h3>
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
    <div className="animate-slide-up space-y-4">
      <div className="text-center mb-2">
        <div className="text-6xl mb-2 animate-sway">🗺️</div>
        <h2 className="text-3xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Choose Your Quest!</h2>
        <p className="text-clay-text-muted font-semibold">Each lesson is a new adventure! ⚔️🚀🏹</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {lessons.map((unit, i) => {
          const emoji = UNIT_EMOJI[unit.title] || '📚'
          const bg = UNIT_BG[i % UNIT_BG.length]
          const border = UNIT_BORDER[i % UNIT_BORDER.length]
          return (
            <button
              key={unit.unit}
              onClick={() => onSelectUnit(i)}
              className={`clay-card-interactive p-4 text-center border-3 ${border} ${bg} hover:scale-105`}
            >
              <div className="text-5xl mb-2">{emoji}</div>
              <span className="text-clay-text-muted text-xs font-extrabold">Unit {unit.unit}</span>
              <p className="text-clay-text font-extrabold text-base leading-tight mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{unit.title}</p>
              <span className="text-clay-text-muted/70 text-xs font-semibold">{unit.words.length} words</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
