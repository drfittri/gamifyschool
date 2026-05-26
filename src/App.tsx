import { BookOpen, Trophy, Zap, Star, Award, ArrowLeft, RefreshCw, Puzzle, Type, Image, PenLine, Search, HelpCircle, Ear, LayoutGrid, AlignJustify, CheckCheck, FolderKanban, Mic, BookMarked } from 'lucide-react'
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

const GAME_ICONS: Record<string, any> = {
  wordmatch: Puzzle, spellingbee: Type, wordscramble: LayoutGrid, pictureword: Image,
  memorycard: LayoutGrid, fillblank: PenLine, wordsearch: Search, hangman: HelpCircle,
  speedtyping: Zap, listening: Ear,
  sentencebuilder: AlignJustify, grammarblast: CheckCheck, categorysort: FolderKanban,
  phonicsrocket: Mic, comprehensionmap: BookMarked, jetfighter: LayoutGrid,
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
    <div className="min-h-screen bg-clay-bg bg-dots flex flex-col">
      <header className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-3xl font-extrabold text-clay-text leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              <BookOpen className="inline w-8 h-8 text-clay-primary -mt-1 mr-1" strokeWidth={2.5} />
              GamifySchool
            </h1>
            <p className="text-clay-text-muted text-sm font-semibold ml-1">English Year 1</p>
          </div>
          <button
            onClick={() => setTab(t => t === 'games' ? 'badges' : 'games')}
            className="clay-card-interactive px-4 py-2.5 text-sm font-bold text-clay-text flex items-center gap-2"
          >
            {tab === 'games' ? (
              <><Trophy className="w-5 h-5 text-clay-yellow" strokeWidth={2.5} />Badges ({earnedBadges.length})</>
            ) : (
              <><BookOpen className="w-5 h-5 text-clay-primary" strokeWidth={2.5} />Games</>
            )}
          </button>
        </div>
        <LevelBar xp={stats.xp} />
        <div className="flex gap-5 mt-2 text-clay-text-muted text-sm font-bold pl-1">
          <span className="flex items-center gap-1"><Zap className="w-4 h-4" strokeWidth={2.5} />Best: {stats.maxStreak}</span>
          <span className="flex items-center gap-1"><Star className="w-4 h-4" strokeWidth={2.5} />Perfect: {stats.perfectScores}</span>
          <span>Level {currentLevel}</span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-8 overflow-auto">
        {tab === 'badges' ? (
          <div className="animate-slide-up space-y-4">
            <h2 className="text-2xl font-extrabold text-clay-text text-center" style={{ fontFamily: 'var(--font-display)' }}>
              <Trophy className="inline w-6 h-6 text-clay-yellow -mt-1 mr-1" strokeWidth={2.5} />
              Your Badges
            </h2>
            <BadgeGrid stats={stats} />
          </div>
        ) : (
          <GamePicker
            onSelectUnit={(i) => navigate(`/play/${i}`)}
            onSelectGame={(game, unit) => navigate(`/play/${unit}/${game.id}`)}
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
            <p className="text-clay-primary text-sm font-extrabold mb-2">Phonics</p>
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

      <h3 className="text-2xl font-extrabold text-clay-text mb-3" style={{ fontFamily: 'var(--font-display)' }}>Pick a Game!</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {GAME_DEFINITIONS.map(game => {
          const GameIcon = GAME_ICONS[game.id] || BookOpen
          return (
            <button
              key={game.id}
              onClick={() => handleGame(game)}
              className="clay-card-interactive p-4 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl flex items-center justify-center" style={{ backgroundColor: game.color + '20' }}>
                <GameIcon className="w-7 h-7" style={{ color: game.color }} strokeWidth={2.5} />
              </div>
              <p className="text-clay-text font-extrabold text-base" style={{ fontFamily: 'var(--font-display)' }}>{game.title}</p>
              <p className="text-clay-text-muted text-xs mt-1 font-semibold">{game.description}</p>
            </button>
          )
        })}
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

  const allWords = unit ? unit.words : lessons.flatMap(l => l.words)

  const handleCorrect = () => { setCorrect(c => c + 1); setCombo(c => c + 1); addCorrectAnswer() }
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
  const GameIcon = GAME_ICONS[gameId || ''] || BookOpen

  return (
    <div className="min-h-screen bg-clay-bg bg-dots flex flex-col">
      {showConfetti && <Confetti />}
      <div className="sticky top-0 z-10 bg-clay-bg/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b-3 border-clay-surface">
        <button onClick={() => navigate(`/play/${idx}`)} className="flex items-center gap-1 text-clay-text hover:text-clay-primary transition-colors">
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2 text-clay-text font-extrabold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
          <GameIcon className="w-6 h-6" style={{ color: gameDef.color }} strokeWidth={2.5} />
          {gameDef.title}
        </div>
        <div className="flex items-center gap-2">
          {combo >= 3 && <span className="text-clay-cta font-extrabold text-sm animate-pop-in">x{combo}!</span>}
          <span className="inline-flex items-center gap-1 bg-clay-success/15 text-clay-success px-2.5 py-1 rounded-full text-sm font-extrabold">
            {correct}
          </span>
          <span className="inline-flex items-center gap-1 bg-clay-error/15 text-clay-error px-2.5 py-1 rounded-full text-sm font-extrabold">
            {wrong}
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {!completed ? (
          <GameComp words={allWords} unit={unit} onCorrect={handleCorrect} onWrong={handleWrong} onComplete={handleComplete} />
        ) : (
          <div className="clay-card p-8 text-center animate-pop-in max-w-md w-full space-y-5">
            <Award className="w-20 h-20 mx-auto text-clay-yellow" strokeWidth={1.5} />
            <h2 className="text-3xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
              {percent >= 80 ? 'Amazing!' : percent >= 50 ? 'Good Job!' : 'Keep Trying!'}
            </h2>
            <p className="text-xl text-clay-text-muted font-bold">{correct} correct out of {total}</p>
            <div className="clay-surface py-3 px-6 inline-block">
              <Star className="w-6 h-6 inline text-clay-yellow -mt-1 mr-1" strokeWidth={2.5} />
              <span className="text-3xl font-extrabold text-clay-primary" style={{ fontFamily: 'var(--font-display)' }}>+{xpEarned} XP</span>
            </div>
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={() => navigate(`/play/${idx}`)} className="clay-card-interactive px-6 py-3 font-extrabold text-clay-text text-lg">
                More Games
              </button>
              <button onClick={() => navigate(`/play/${idx}/${gameId}`)} className="clay-button px-6 py-3 text-lg flex items-center gap-2">
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
