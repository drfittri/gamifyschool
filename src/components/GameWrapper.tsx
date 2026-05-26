import type { ReactNode } from 'react'
import { useState } from 'react'
import Confetti from './Confetti'

interface Props {
  title: string
  emoji: string
  bgColor: string
  children: (props: {
    onCorrect: () => void
    onWrong: () => void
    onComplete: () => void
  }) => ReactNode
  onBack: () => void
}

export default function GameWrapper({ title, emoji, bgColor, children, onBack }: Props) {
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [combo, setCombo] = useState(0)

  const handleCorrect = () => { setCorrect(c => c + 1); setCombo(c => c + 1) }
  const handleWrong = () => { setWrong(w => w + 1); setCombo(0) }

  const handleComplete = () => {
    setCompleted(true)
    if (correct > 0 && wrong === 0) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 4000)
    }
  }

  const total = correct + wrong
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgColor} flex flex-col`}>
      {showConfetti && <Confetti />}
      <div className="bg-white/10 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="text-white text-2xl hover:scale-110 transition-transform px-2">←</button>
        <div className="text-white font-extrabold text-xl">{emoji} {title}</div>
        <div className="flex gap-2 items-center">
          {combo >= 3 && <span className="text-yellow-300 font-bold text-sm animate-pop-in">🔥 x{combo}</span>}
          <span className="bg-green-400/80 text-white px-3 py-1 rounded-full text-sm font-bold">{correct} ✓</span>
          <span className="bg-red-400/80 text-white px-3 py-1 rounded-full text-sm font-bold">{wrong} ✗</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {!completed ? (
          children({ onCorrect: handleCorrect, onWrong: handleWrong, onComplete: handleComplete })
        ) : (
          <div className="text-center animate-slide-up space-y-5">
            <div className="text-7xl">{percent >= 80 ? '🎉' : percent >= 50 ? '👍' : '💪'}</div>
            <div className="text-4xl font-extrabold text-white drop-shadow">Great job!</div>
            <div className="text-xl text-white/80">
              You got <span className="text-yellow-300 font-extrabold">{correct}/{total}</span> correct!
            </div>
            <div className="text-3xl text-yellow-300 font-extrabold">
              +{correct * 10 + (combo >= 3 ? combo * 5 : 0) + (wrong === 0 ? 25 : 0)} XP
            </div>
            <button onClick={onBack} className="px-8 py-3 rounded-full bg-white/90 text-indigo-700 font-extrabold text-xl shadow-xl hover:scale-110 transition-transform">
              Back to Games
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
