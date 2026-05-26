import { BookOpen, Trophy, ArrowLeft, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { useProgress } from './hooks/useProgress'
import { lessons } from './data/lessons'
import { BADGES } from './data/badges'
import { GAME_DEFINITIONS } from './utils/types'
import type { GameDefinition } from './utils/types'
import { xpProgress } from './utils/types'
import LevelBar from './components/LevelBar'
import BadgeGrid from './components/BadgeGrid'
import GamePicker from './components/GamePicker'
import Confetti from './components/Confetti'
import WordMatchGame from './games/WordMatch'
import SpellingBeeGame from './games/SpellingBee'
import WordScrambleGame from './games/WordScramble'
import PictureWordGame from './games/PictureWord'
import MemoryCardGame from './games/MemoryCard'
import FillBlankGame from './games/FillBlank'
import WordSearchGame from './games/WordSearch'
import HangmanGame from './games/Hangman'
import SpeedTypingGame from './games/SpeedTyping'
import ListeningGame from './games/Listening'
import SentenceBuilder from './games/SentenceBuilder'
import GrammarBlast from './games/GrammarBlast'
import CategorySort from './games/CategorySort'
import PhonicsRocket from './games/PhonicsRocket'
import ComprehensionMap from './games/ComprehensionMap'
import JetFighterGame from './games/JetFighter'
import { playGameStart } from './hooks/useSound'

const gameComponents: Record<string, any> = {
  wordmatch: WordMatchGame, spellingbee: SpellingBeeGame, wordscramble: WordScrambleGame,
  pictureword: PictureWordGame, memorycard: MemoryCardGame, fillblank: FillBlankGame,
  wordsearch: WordSearchGame, hangman: HangmanGame, speedtyping: SpeedTypingGame,
  listening: ListeningGame,
  sentencebuilder: SentenceBuilder, grammarblast: GrammarBlast, categorysort: CategorySort,
  phonicsrocket: PhonicsRocket, comprehensionmap: ComprehensionMap, jetfighter: JetFighterGame,
}

function App() {
  const { stats, addCorrectAnswer, addWrongAnswer, addPerfectScore, awardBadge } = useProgress()
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    BADGES.forEach(badge => {
      if (!stats.badges.includes(badge.id) && badge.conditionMet(stats)) {
        awardBadge(badge.id)
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      }
    })
  }, [stats])

  return (
    <HashRouter>
      {showConfetti && <Confetti />}
      <Routes>
        <Route path="/" element={<Dashboard stats={stats} />} />
        <Route path="/play/:unitIndex" element={<LessonView />} />
        <Route path="/play/:unitIndex/:gameId" element={
          <GameView addCorrectAnswer={addCorrectAnswer} addWrongAnswer={addWrongAnswer} addPerfectScore={addPerfectScore} />
        } />
      </Routes>
    </HashRouter>
  )
}

function Dashboard({ stats }: { stats: any }) {
  const navigate = useNavigate()
  const { currentLevel } = xpProgress(stats.xp)
  const [tab, setTab] = useState<'games' | 'badges'>('games')
  const earnedBadges = BADGES.filter(b => stats.badges.includes(b.id))

  return (
    <div className="min-h-screen bg-clay-bg bg-dots flex flex-col relative overflow-hidden">
      {/* Decorative floating background emojis */}
      <div className="absolute top-6 right-5 text-5xl opacity-20 animate-float pointer-events-none select-none">🌟</div>
      <div className="absolute top-36 left-2 text-4xl opacity-15 animate-float pointer-events-none select-none" style={{ animationDelay: '1.5s' }}>⭐</div>
      <div className="absolute top-80 right-10 text-3xl opacity-15 animate-float pointer-events-none select-none" style={{ animationDelay: '3s' }}>🎈</div>
      <div className="absolute bottom-40 left-5 text-4xl opacity-10 animate-float pointer-events-none select-none" style={{ animationDelay: '2s' }}>✨</div>
      <div className="absolute bottom-20 right-3 text-3xl opacity-10 animate-float pointer-events-none select-none" style={{ animationDelay: '4s' }}>🎉</div>

      <header className="px-4 pt-5 pb-3 relative">
        {/* Colourful top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 rounded-b-full" style={{
          background: 'linear-gradient(90deg, #FF6B6B, #FECA57, #48DBFB, #FF9FF3, #54A0FF, #5F27CD)',
          backgroundSize: '400% 400%',
          animation: 'rainbow-slide 6s ease infinite',
        }} />

        <div className="flex items-center justify-between mb-3 mt-1">
          <div>
            <h1 className="text-3xl font-extrabold text-clay-text leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              🎓 GamifySchool
            </h1>
            <p className="text-clay-text-muted text-sm font-semibold ml-1">✏️ English Year 1</p>
          </div>
          <button
            onClick={() => setTab(t => t === 'games' ? 'badges' : 'games')}
            className="clay-card-interactive px-4 py-2.5 text-sm font-bold text-clay-text flex items-center gap-2"
          >
            {tab === 'games' ? (
              <><Trophy className="w-5 h-5 text-clay-yellow" strokeWidth={2.5} />Honours ({earnedBadges.length})</>
            ) : (
              <><BookOpen className="w-5 h-5 text-clay-primary" strokeWidth={2.5} />Games</>
            )}
          </button>
        </div>

        <LevelBar xp={stats.xp} />

        <div className="flex gap-5 mt-2 text-clay-text-muted text-sm font-bold pl-1">
          <span className="flex items-center gap-1">🔥 Best: {stats.maxStreak}</span>
          <span className="flex items-center gap-1">⭐ Perfect: {stats.perfectScores}</span>
          <span className="flex items-center gap-1">🏆 Level {currentLevel}</span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-8 overflow-auto relative">
        {tab === 'badges' ? (
          <div className="animate-slide-up space-y-4">
            <h2 className="text-2xl font-extrabold text-clay-text text-center" style={{ fontFamily: 'var(--font-display)' }}>
              🏆 Battle Honours
            </h2>
            <BadgeGrid stats={stats} />
          </div>
        ) : (
          <GamePicker
            onSelectUnit={(i) => navigate(`/play/${i}`)}
            onSelectGame={(game: GameDefinition, unit: number) => navigate(`/play/${unit}/${game.id}`)}
            unitIndex={null}
          />
        )}
      </main>
    </div>
  )
}

function LessonView() {
  const navigate = useNavigate()
  const { unitIndex } = useParams()
  const idx = parseInt(unitIndex || '0')

  if (isNaN(idx) || idx < 0 || idx >= lessons.length) {
    return (
      <div className="min-h-screen bg-clay-bg flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-xl font-bold text-clay-text mb-4">Lesson not found!</p>
          <button onClick={() => navigate('/')} className="clay-button px-6 py-3">Go Home</button>
        </div>
      </div>
    )
  }

  const unit = lessons[idx]

  const handleGame = (game: GameDefinition) => {
    playGameStart()
    navigate(`/play/${idx}/${game.id}`)
  }

  return (
    <div className="min-h-screen bg-clay-bg bg-stars p-4">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-clay-text font-bold text-lg mb-3 hover:text-clay-primary transition-colors">
        <ArrowLeft className="w-6 h-6" strokeWidth={2.5} /> Home
      </button>

      <div className="clay-card p-6 mb-5">
        <span className="inline-block bg-clay-primary-light/20 text-clay-primary font-extrabold text-sm px-3 py-1 rounded-full mb-2">Unit {unit.unit}</span>
        <h2 className="text-4xl font-extrabold text-clay-text mb-3" style={{ fontFamily: 'var(--font-display)' }}>{unit.title}</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {unit.words.map(w => (
            <span key={w} className="bg-clay-surface text-clay-text px-3 py-2 rounded-xl text-sm font-bold">{w}</span>
          ))}
        </div>
        {unit.phonics.length > 0 && (
          <div className="bg-clay-surface rounded-2xl p-4">
            <p className="text-clay-primary text-sm font-extrabold mb-2">🔤 Phonics</p>
            <div className="flex flex-wrap gap-3">
              {unit.phonics.map(p => (
                <span key={p.sound} className="text-clay-text text-sm">
                  <span className="text-clay-cta font-extrabold text-lg">/{p.sound}/</span> {p.words.join(', ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <h3 className="text-2xl font-extrabold text-clay-text mb-3" style={{ fontFamily: 'var(--font-display)' }}>🎮 Pick a Game!</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {GAME_DEFINITIONS.map(game => (
          <button
            key={game.id}
            onClick={() => handleGame(game)}
            className="clay-card-interactive p-4 text-center"
          >
            <div className="text-4xl mb-2">{game.emoji}</div>
            <p className="text-clay-text font-extrabold text-base" style={{ fontFamily: 'var(--font-display)' }}>{game.title}</p>
            <p className="text-clay-text-muted text-xs mt-1 font-semibold">{game.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function GameView({
  addCorrectAnswer, addWrongAnswer, addPerfectScore,
}: { addCorrectAnswer: () => void; addWrongAnswer: () => void; addPerfectScore: () => void }) {
  const navigate = useNavigate()
  const { unitIndex, gameId } = useParams()
  const idx = parseInt(unitIndex || '0')
  const unit = lessons[idx]
  const gameDef = GAME_DEFINITIONS.find(g => g.id === gameId)
  const GameComp = gameComponents[gameId || '']

  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [combo, setCombo] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [starParticles, setStarParticles] = useState<number[]>([])

  const allWords = unit ? unit.words : lessons.flatMap(l => l.words)

  const handleCorrect = () => {
    setCorrect(c => c + 1)
    setCombo(c => c + 1)
    addCorrectAnswer()
    const id = Date.now() + Math.random()
    setStarParticles(prev => [...prev, id])
    setTimeout(() => setStarParticles(prev => prev.filter(p => p !== id)), 1000)
  }
  const handleWrong = () => { setWrong(w => w + 1); setCombo(0); addWrongAnswer() }
  const handleComplete = () => {
    setCompleted(true)
    if (correct > 0 && wrong === 0) { addPerfectScore(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000) }
  }

  if (!unit || !GameComp || !gameDef) {
    return <div className="min-h-screen bg-clay-bg flex items-center justify-center"><p className="text-xl font-bold">Game not found!</p></div>
  }

  const total = correct + wrong
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0
  const xpEarned = correct * 10 + (wrong === 0 && completed ? 25 : 0) + (combo >= 3 ? combo * 5 : 0)
  const stars3 = percent >= 90
  const stars2 = percent >= 60
  const stars1 = percent >= 20 || correct > 0

  return (
    <div className="min-h-screen bg-clay-bg bg-dots flex flex-col">
      {showConfetti && <Confetti />}

      {/* Floating star particles on correct answers */}
      {starParticles.map(id => (
        <div key={id} className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <span className="text-8xl animate-float-up select-none">⭐</span>
        </div>
      ))}

      {/* Game header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b-4 border-clay-surface shadow-sm">
        {/* Title row */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <button
            onClick={() => navigate(`/play/${idx}`)}
            className="w-10 h-10 rounded-2xl bg-clay-surface flex items-center justify-center hover:scale-110 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-clay-text" strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{gameDef.emoji}</span>
            <span className="text-xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>{gameDef.title}</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Score row */}
        <div className="px-4 pb-3 flex items-center justify-center gap-3 flex-wrap">
          {/* Stars earned (correct count) */}
          <div className="flex items-center gap-2 bg-amber-50 border-3 border-amber-200 rounded-2xl px-4 py-1.5 shadow-sm">
            <span key={correct} className={`text-2xl ${correct > 0 ? 'animate-star-pop' : ''}`}>⭐</span>
            <span className="text-2xl font-extrabold text-amber-600" style={{ fontFamily: 'var(--font-display)' }}>{correct}</span>
            <span className="text-sm text-amber-400 font-bold">stars</span>
          </div>

          {/* Combo badge */}
          {combo >= 2 && (
            <div key={combo} className="bg-orange-100 border-3 border-orange-300 text-orange-700 px-3 py-1.5 rounded-2xl font-extrabold text-base animate-bounce-in shadow-sm" style={{ fontFamily: 'var(--font-display)' }}>
              🔥 ×{combo} Combo!
            </div>
          )}

          {/* Wrong count */}
          {wrong > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border-3 border-red-200 rounded-2xl px-3 py-1.5 shadow-sm">
              <span className="text-xl">❌</span>
              <span className="text-xl font-extrabold text-red-500" style={{ fontFamily: 'var(--font-display)' }}>{wrong}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {!completed ? (
          <GameComp words={allWords} unit={unit} onCorrect={handleCorrect} onWrong={handleWrong} onComplete={handleComplete} />
        ) : (
          <div className="clay-card p-8 text-center animate-bounce-in max-w-md w-full space-y-5">
            {/* Big trophy/emoji */}
            <div className="text-8xl animate-sway">
              {percent >= 80 ? '🏆' : percent >= 50 ? '🌟' : '💪'}
            </div>

            <h2 className="text-4xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
              {percent >= 80 ? '🎉 Amazing!' : percent >= 50 ? '👏 Good Job!' : '💪 Keep Going!'}
            </h2>

            {/* Star rating */}
            <div className="flex justify-center gap-3">
              {[stars1, stars2, stars3].map((earned, i) => (
                <span
                  key={i}
                  className={`text-5xl transition-all duration-300 ${earned ? 'animate-bounce-in' : 'opacity-20 grayscale'}`}
                  style={{ animationDelay: `${i * 0.18}s` }}
                >
                  ⭐
                </span>
              ))}
            </div>

            <p className="text-xl text-clay-text-muted font-bold">
              {correct} correct out of {total}
            </p>

            {/* XP earned badge */}
            <div className="bg-amber-50 border-3 border-amber-200 rounded-2xl py-3 px-6 inline-flex items-center gap-2 shadow-sm">
              <span className="text-3xl">⭐</span>
              <span className="text-3xl font-extrabold text-amber-600" style={{ fontFamily: 'var(--font-display)' }}>
                +{xpEarned} XP
              </span>
            </div>

            <div className="flex gap-3 justify-center mt-2">
              <button
                onClick={() => navigate(`/play/${idx}`)}
                className="clay-card-interactive px-6 py-3 font-extrabold text-clay-text text-lg border-3 border-white/80"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                🎮 More Games
              </button>
              <button
                onClick={() => navigate(`/play/${idx}/${gameId}`)}
                className="clay-button px-6 py-3 text-lg flex items-center gap-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <RefreshCw className="w-5 h-5" strokeWidth={2.5} /> Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
