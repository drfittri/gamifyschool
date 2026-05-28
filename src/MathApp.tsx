import { ArrowLeft, RefreshCw, Trophy, BookOpen } from 'lucide-react'
import { useState, useMemo, useEffect, type ComponentType } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { useProgress } from './hooks/useProgress'
import { BADGES } from './data/badges'
import { xpProgress, type GameStats } from './utils/types'
import LevelBar from './components/LevelBar'
import BadgeGrid from './components/BadgeGrid'
import Confetti from './components/Confetti'
import { MATH_UNITS, MATH_GAMES, gamesForUnit, generateQuestions } from './data/math'
import { playGameStart } from './hooks/useSound'
import MathShooter from './games/math/MathShooter'
import MathRocket from './games/math/MathRocket'
import MathRace from './games/math/MathRace'
import MathCount from './games/math/MathCount'
import MathFraction from './games/math/MathFraction'
import MathCoin from './games/math/MathCoin'
import MathClock from './games/math/MathClock'
import MathBalance from './games/math/MathBalance'
import MathShape from './games/math/MathShape'

/* AI-FIX: replaced `Record<string, any>` with the real shared game-component
   signature so prop mismatches are caught at compile time. */
import type { MathQuestion, MathUnit } from './data/math'
type MathGameComponent = ComponentType<{
  questions: MathQuestion[]
  unit: MathUnit
  onCorrect: () => void
  onWrong: () => void
  onComplete: () => void
}>

const components: Record<string, MathGameComponent> = {
  mshooter: MathShooter,
  mrocket: MathRocket,
  mrace: MathRace,
  mcount: MathCount,
  mfraction: MathFraction,
  mcoin: MathCoin,
  mclock: MathClock,
  mbalance: MathBalance,
  mshape: MathShape,
}

const UNIT_BG = ['bg-blue-100','bg-purple-100','bg-amber-100','bg-yellow-100','bg-slate-100','bg-green-100','bg-indigo-100','bg-pink-100']
const UNIT_BORDER = ['border-blue-300','border-purple-300','border-amber-300','border-yellow-300','border-slate-300','border-green-300','border-indigo-300','border-pink-300']

export default function MathApp() {
  const { stats, addCorrectAnswer, addWrongAnswer, addPerfectScore, awardBadge } = useProgress()
  const [showConfetti, setShowConfetti] = useState(false)

  /* AI-FIX: clear the confetti timer on unmount / re-run to avoid a stray
     setState after the component leaves the tree. */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    BADGES.forEach(b => {
      if (!stats.badges.includes(b.id) && b.conditionMet(stats)) {
        awardBadge(b.id); setShowConfetti(true)
        timer = setTimeout(() => setShowConfetti(false), 4000)
      }
    })
    return () => { if (timer) clearTimeout(timer) }
  }, [stats])

  return (
    <>
      {showConfetti && <Confetti />}
      <Routes>
        <Route path="/" element={<MathDashboard stats={stats} />} />
        <Route path="/play/:unitIndex" element={<MathLessonView />} />
        <Route path="/play/:unitIndex/:gameId" element={
          <MathGameView addCorrect={addCorrectAnswer} addWrong={addWrongAnswer} addPerfect={addPerfectScore} />
        } />
      </Routes>
    </>
  )
}

function MathDashboard({ stats }: { stats: GameStats }) { /* AI-FIX: was `any` */
  const navigate = useNavigate()
  const { currentLevel } = xpProgress(stats.xp)
  const [tab, setTab] = useState<'games'|'badges'>('games')
  const earned = BADGES.filter(b => stats.badges.includes(b.id))

  return (
    <div className="min-h-screen bg-clay-bg bg-dots flex flex-col relative overflow-hidden">
      <header className="px-4 pt-5 pb-3 relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 rounded-b-full" style={{
          background: 'linear-gradient(90deg,#1976d2,#42a5f5,#7b1fa2,#ec407a,#ff7043,#ffca28)',
          backgroundSize: '400% 400%', animation: 'rainbow-slide 6s ease infinite',
        }} />
        <div className="flex items-center justify-between mb-3 mt-1">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="w-10 h-10 rounded-2xl bg-clay-surface flex items-center justify-center hover:scale-110 active:scale-95">
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-clay-text leading-tight" style={{ fontFamily: 'var(--font-display)' }}>🎓 GamifySchool</h1>
              <p className="text-clay-text-muted text-sm font-semibold ml-1">🔢 Matematik Tahun 1</p>
            </div>
          </div>
          <button onClick={() => setTab(t => t === 'games' ? 'badges' : 'games')}
            className="clay-card-interactive px-4 py-2.5 text-sm font-bold text-clay-text flex items-center gap-2">
            {tab === 'games'
              ? <><Trophy className="w-5 h-5 text-clay-yellow" strokeWidth={2.5} />Pingat ({earned.length})</>
              : <><BookOpen className="w-5 h-5 text-clay-primary" strokeWidth={2.5} />Permainan</>}
          </button>
        </div>
        <LevelBar xp={stats.xp} />
        <div className="flex gap-5 mt-2 text-clay-text-muted text-sm font-bold pl-1">
          <span>🔥 Terbaik: {stats.maxStreak}</span>
          <span>⭐ Sempurna: {stats.perfectScores}</span>
          <span>🏆 Tahap {currentLevel}</span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-8 overflow-auto">
        {tab === 'badges' ? (
          <div className="animate-slide-up space-y-4">
            <h2 className="text-2xl font-extrabold text-clay-text text-center" style={{ fontFamily: 'var(--font-display)' }}>🏆 Pingat Pencapaian</h2>
            <BadgeGrid stats={stats} />
          </div>
        ) : (
          <div className="animate-slide-up space-y-4">
            <div className="text-center mb-2">
              <div className="text-5xl mb-2 animate-sway">🗺️</div>
              <h2 className="text-2xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>Pilih Misi!</h2>
              <p className="text-clay-text-muted font-semibold">8 unit matematik, pengembaraan bertema 🪖🚀⚔️</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {MATH_UNITS.map((u, i) => (
                <button key={u.unit} onClick={() => navigate(`/math/play/${i}`)}
                  className={`clay-card-interactive p-4 text-center border-3 ${UNIT_BORDER[i % UNIT_BORDER.length]} ${UNIT_BG[i % UNIT_BG.length]} hover:scale-105`}>
                  <div className="text-5xl mb-2">{u.emoji}</div>
                  <span className="text-clay-text-muted text-xs font-extrabold">Unit {u.unit}</span>
                  <p className="text-clay-text font-extrabold text-base leading-tight mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{u.title}</p>
                  <span className="text-clay-text-muted/70 text-xs font-semibold">{u.games.length} permainan</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function MathLessonView() {
  const navigate = useNavigate()
  const { unitIndex } = useParams()
  const idx = parseInt(unitIndex || '0')
  const unit = MATH_UNITS[idx]
  if (!unit) {
    return <div className="min-h-screen flex items-center justify-center bg-clay-bg">
      <button onClick={() => navigate('/math')} className="clay-button px-6 py-3">Back</button>
    </div>
  }
  const games = gamesForUnit(idx)
  return (
    <div className="min-h-screen bg-clay-bg bg-stars p-4">
      <button onClick={() => navigate('/math')} className="flex items-center gap-1 text-clay-text font-bold text-lg mb-3 hover:text-clay-primary">
        <ArrowLeft className="w-6 h-6" strokeWidth={2.5} /> Laman Matematik
      </button>
      <div className="clay-card p-6 mb-5">
        <span className="inline-block bg-clay-primary-light/20 text-clay-primary font-extrabold text-sm px-3 py-1 rounded-full mb-2">Unit {unit.unit}</span>
        <h2 className="text-4xl font-extrabold text-clay-text mb-1" style={{ fontFamily: 'var(--font-display)' }}>{unit.emoji} {unit.title}</h2>
        <p className="text-clay-text-muted text-sm font-semibold italic mb-3">{unit.titleEn}</p>
        <div className="flex flex-wrap gap-2">
          {unit.concepts.map(c => (
            <span key={c} className="bg-clay-surface text-clay-text px-3 py-1.5 rounded-xl text-sm font-bold">{c}</span>
          ))}
        </div>
      </div>
      <h3 className="text-2xl font-extrabold text-clay-text mb-3" style={{ fontFamily: 'var(--font-display)' }}>🎮 Pilih Permainan!</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {games.map(g => (
          <button key={g.id} onClick={() => { playGameStart(); navigate(`/math/play/${idx}/${g.id}`) }}
            className="clay-card-interactive p-4 text-center">
            <div className="text-4xl mb-2">{g.emoji}</div>
            <p className="text-clay-text font-extrabold text-base" style={{ fontFamily: 'var(--font-display)' }}>{g.title}</p>
            <p className="text-clay-text-muted text-xs mt-1 font-semibold">{g.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function MathGameView({ addCorrect, addWrong, addPerfect }: { addCorrect: () => void; addWrong: () => void; addPerfect: () => void }) {
  const navigate = useNavigate()
  const { unitIndex, gameId } = useParams()
  const idx = parseInt(unitIndex || '0')
  const unit = MATH_UNITS[idx]
  const gameDef = MATH_GAMES.find(g => g.id === gameId)
  const Comp = components[gameId || '']

  const questions = useMemo(() => generateQuestions(idx, 8), [idx, gameId])
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [done, setDone] = useState(false)
  const [combo, setCombo] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  if (!unit || !Comp || !gameDef) {
    return <div className="min-h-screen bg-clay-bg flex items-center justify-center">
      <button onClick={() => navigate('/math')} className="clay-button px-6 py-3">Back</button>
    </div>
  }

  const handleC = () => { setCorrect(c => c+1); setCombo(c => c+1); addCorrect() }
  const handleW = () => { setWrong(w => w+1); setCombo(0); addWrong() }
  const handleD = () => {
    setDone(true)
    if (correct > 0 && wrong === 0) { addPerfect(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000) }
  }

  const total = correct + wrong
  const pct = total ? Math.round(correct / total * 100) : 0
  const xp = correct * 10 + (wrong === 0 && done ? 25 : 0) + (combo >= 3 ? combo * 5 : 0)

  return (
    <div className="min-h-screen bg-clay-bg bg-dots flex flex-col">
      {showConfetti && <Confetti />}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b-4 border-clay-surface">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <button onClick={() => navigate(`/math/play/${idx}`)}
            className="w-10 h-10 rounded-2xl bg-clay-surface flex items-center justify-center hover:scale-110 active:scale-95">
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{gameDef.emoji}</span>
            <span className="text-xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>{gameDef.title}</span>
          </div>
          <div className="w-10" />
        </div>
        <div className="px-4 pb-3 flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-amber-50 border-3 border-amber-200 rounded-2xl px-4 py-1.5">
            <span className="text-2xl">⭐</span>
            <span className="text-2xl font-extrabold text-amber-600">{correct}</span>
          </div>
          {combo >= 2 && (
            <div className="bg-orange-100 border-3 border-orange-300 text-orange-700 px-3 py-1.5 rounded-2xl font-extrabold text-base animate-bounce-in">
              🔥 ×{combo} Combo!
            </div>
          )}
          {wrong > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border-3 border-red-200 rounded-2xl px-3 py-1.5">
              <span className="text-xl">❌</span>
              <span className="text-xl font-extrabold text-red-500">{wrong}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {!done ? (
          <Comp questions={questions} unit={unit} onCorrect={handleC} onWrong={handleW} onComplete={handleD} />
        ) : (
          <div className="clay-card p-8 text-center animate-bounce-in max-w-md w-full space-y-5">
            <div className="text-8xl animate-sway">{pct >= 80 ? '🏆' : pct >= 50 ? '🌟' : '💪'}</div>
            <h2 className="text-4xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
              {pct >= 80 ? '🎉 Hebat!' : pct >= 50 ? '👏 Syabas!' : '💪 Cuba Lagi!'}
            </h2>
            <div className="flex justify-center gap-3">
              {[pct >= 20 || correct > 0, pct >= 60, pct >= 90].map((earnedStar, i) => (
                <span key={i} className={`text-5xl ${earnedStar ? 'animate-bounce-in' : 'opacity-20 grayscale'}`} style={{ animationDelay: `${i*0.18}s` }}>⭐</span>
              ))}
            </div>
            <p className="text-xl text-clay-text-muted font-bold">{correct} betul daripada {total}</p>
            <div className="bg-amber-50 border-3 border-amber-200 rounded-2xl py-3 px-6 inline-flex items-center gap-2">
              <span className="text-3xl">⭐</span>
              <span className="text-3xl font-extrabold text-amber-600">+{xp} XP</span>
            </div>
            <div className="flex gap-3 justify-center mt-2">
              <button onClick={() => navigate(`/math/play/${idx}`)} className="clay-card-interactive px-6 py-3 font-extrabold text-clay-text text-lg border-3 border-white/80">🎮 Lain Permainan</button>
              <button onClick={() => { setCorrect(0); setWrong(0); setDone(false); setCombo(0) }} className="clay-button px-6 py-3 text-lg flex items-center gap-2">
                <RefreshCw className="w-5 h-5" strokeWidth={2.5} /> Main Lagi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
