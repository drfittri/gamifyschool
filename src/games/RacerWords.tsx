import { useState, useEffect, useCallback } from 'react'
import { playCorrect, playWrong, playClick } from '../hooks/useSound'
import { Flag } from 'lucide-react'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }

const CAR_COLORS = ['#EF4444', '#3B82F6', '#10B981']
const CAR_NAMES = ['Red Rocket', 'Blue Blaze', 'Green Machine']

export default function RacerWords({ words, onCorrect, onWrong, onComplete }: Props) {
  const pool = words.slice(0, 12)
  const [round, setRound] = useState(0)
  const [positions, setPositions] = useState([0, 0, 0])
  const [question, setQuestion] = useState<{ word: string; options: string[] } | null>(null)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [winner, setWinner] = useState<number | null>(null)
  const [playerLane] = useState(0)
  const [shaking, setShaking] = useState(-1)
  const maxRounds = 10

  const generateQ = useCallback(() => {
    const word = pool[Math.floor(Math.random() * pool.length)]
    const wrongs = shuffle(pool.filter(w => w !== word)).slice(0, 2)
    setQuestion({ word, options: shuffle([word, ...wrongs]) })
    setAnswered(false)
    setChosen(null)
  }, [pool.join(',')])

  useEffect(() => { if (round < maxRounds && !winner) generateQ() }, [round, winner])

  const handleAnswer = (opt: string) => {
    if (answered || winner !== null || !question) return
    setChosen(opt); setAnswered(true)

    if (opt === question.word) {
      playCorrect(); onCorrect()
      setPositions(p => { const n = [...p]; n[playerLane] = Math.min(n[playerLane] + 1, maxRounds); return n })
      const aiMoves = [0, 1, 2].filter(i => i !== playerLane).map(i => {
        const ai = Math.random() > 0.35 ? 1 : 0
        return { lane: i, move: ai }
      })
      const newPos = [...positions]
      newPos[playerLane] = Math.min(newPos[playerLane] + 1, maxRounds)
      aiMoves.forEach(({ lane, move }) => { newPos[lane] = Math.min(newPos[lane] + move, maxRounds) })
      setPositions(newPos)
      setTimeout(() => {
        for (let i = 0; i < 3; i++) { if (newPos[i] >= maxRounds) { setWinner(i); playClick(); setTimeout(onComplete, 2000); return } }
        setShaking(playerLane)
        setTimeout(() => setShaking(-1), 500)
        setRound(r => r + 1)
      }, 800)
    } else {
      playWrong(); onWrong()
      const penaltyLane = playerLane
      setShaking(penaltyLane)
      setTimeout(() => setShaking(-1), 500)
      const newPos = [...positions]
      newPos[penaltyLane] = Math.max(0, newPos[penaltyLane] - 0.5)
      const aiMoves = [0, 1, 2].filter(i => i !== playerLane).map(i => {
        const ai = Math.random() > 0.4 ? 1 : 0
        return { lane: i, move: ai }
      })
      aiMoves.forEach(({ lane, move }) => { newPos[lane] = Math.min(newPos[lane] + move, maxRounds) })
      setPositions(newPos)
      setTimeout(() => setRound(r => r + 1), 1000)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xl mx-auto">
      <div className="text-xl font-extrabold text-clay-text flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
        <Flag className="w-6 h-6 text-clay-cta" strokeWidth={2.5} /> Round {round + 1}/{maxRounds}
      </div>

      <div className="w-full bg-clay-surface rounded-2xl p-4 space-y-4 relative overflow-hidden" style={{ minHeight: '200px' }}>
        <div className="absolute right-3 top-3 flex gap-1">
          <div className="bg-black/10 h-full w-[2px]" style={{ height: '160px' }} />
          {[...Array(8)].map((_, i) => <div key={i} className="w-1 h-2 bg-black/20 rounded-sm" />)}
        </div>
        {[0, 1, 2].map(lane => (
          <div key={lane} className="relative h-12 bg-white/40 rounded-xl flex items-center overflow-hidden">
            <div className="absolute left-2 text-xs font-extrabold text-clay-text-muted z-10 w-20 truncate">{CAR_NAMES[lane]}</div>
            <div
              className={`absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out flex items-center gap-1 ${lane === playerLane && shaking === lane ? 'animate-wiggle' : ''}`}
              style={{ left: `${Math.max(4, (positions[lane] / maxRounds) * 75)}%` }}
            >
              <CarRacer color={CAR_COLORS[lane]} isPlayer={lane === playerLane} />
            </div>
          </div>
        ))}
      </div>

      {question && !winner && (
        <div className="clay-card p-4 w-full text-center space-y-3">
          <p className="text-lg text-clay-text-muted font-semibold">What word matches?</p>
          <p className="text-3xl font-extrabold text-clay-text animate-float" style={{ fontFamily: 'var(--font-display)' }}>{question.word}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {question.options.map((opt, i) => {
              const isRight = opt === question.word
              let cls = 'min-h-[50px] min-w-[100px] px-5 py-3 rounded-2xl text-lg font-extrabold transition-all duration-200 border-3'
              if (answered) {
                if (isRight) cls += ' clay-card border-clay-success/30 animate-pop-in'
                else if (chosen === opt) cls += ' bg-clay-error/20 text-clay-error animate-wiggle border-clay-error/30'
                else cls += ' bg-white/30 opacity-40 border-white/20'
              } else cls += ' clay-card-interactive border-white/80'
              return <button key={i} onClick={() => handleAnswer(opt)} disabled={answered} className={cls} style={{ fontFamily: 'var(--font-display)' }}>{opt}</button>
            })}
          </div>
        </div>
      )}

      {winner !== null && (
        <div className="clay-card p-6 text-center animate-pop-in space-y-3">
          <div className="text-6xl">{winner === playerLane ? '🏆' : '😅'}</div>
          <p className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
            {winner === playerLane ? 'You Won the Race!' : `${CAR_NAMES[winner]} won!`}
          </p>
          <p className="text-clay-text-muted font-semibold">
            {winner === playerLane ? 'Amazing driving, champion!' : 'Try again, you can do it!'}
          </p>
        </div>
      )}
    </div>
  )
}

function CarRacer({ color, isPlayer }: { color: string; isPlayer: boolean }) {
  return (
    <div className="relative" style={{ width: 44, height: 28 }}>
      <div className="absolute bottom-0 left-0 right-0 h-3 rounded-t-full" style={{ backgroundColor: color, borderRadius: '10px 10px 2px 2px' }} />
      <div className="absolute top-0 left-1 right-1 h-2 rounded-t-lg" style={{ backgroundColor: color, opacity: 0.7 }} />
      <div className="absolute bottom-[10px] left-[6px] w-[10px] h-[10px] rounded-full bg-gray-800" />
      <div className="absolute bottom-[10px] right-[6px] w-[10px] h-[10px] rounded-full bg-gray-800" />
      <div className="absolute bottom-[11px] left-[8px] w-[6px] h-[6px] rounded-full bg-gray-500" />
      <div className="absolute bottom-[11px] right-[8px] w-[6px] h-[6px] rounded-full bg-gray-500" />
      {isPlayer && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
    </div>
  )
}
