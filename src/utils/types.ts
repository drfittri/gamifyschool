export interface LessonTopic {
  unit: number
  title: string
  words: string[]
  phrases: string[]
  sentences: string[]
  phonics: PhonicsGroup[]
}

export interface PhonicsGroup {
  sound: string
  words: string[]
}

export interface QuizQuestion {
  question: string
  options: string[]
  answer: string
  emoji: string
}

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  conditionMet: (stats: GameStats) => boolean
}

export interface GameStats {
  xp: number
  level: number
  streak: number
  maxStreak: number
  lessonsCompleted: number
  perfectScores: number
  totalCorrect: number
  totalAnswered: number
  badges: string[]
  lastPlayed: string
}

export interface GameDefinition {
  id: string
  title: string
  emoji: string
  description: string
  color: string
  bgColor: string
}

export const XP_PER_ANSWER = 10
export const STREAK_BONUS = 5
export const PERFECT_BONUS = 25

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  return level
}

export function xpProgress(xp: number): { currentLevel: number; currentXp: number; neededXp: number; percent: number } {
  const lvl = Math.max(1, levelFromXp(xp))
  const currentLevelStart = xpForLevel(lvl)
  const nextLevelStart = xpForLevel(lvl + 1)
  const currentXp = Math.max(0, xp - currentLevelStart)
  const neededXp = nextLevelStart - currentLevelStart
  return {
    currentLevel: lvl,
    currentXp,
    neededXp,
    percent: Math.min(100, Math.max(0, Math.round((currentXp / neededXp) * 100))),
  }
}

export const GAME_DEFINITIONS: GameDefinition[] = [
  { id: 'wordmatch', title: 'Dragon Match', emoji: '🐉', description: 'Match fire dragons to their shadow twins!', color: '#FF6B6B', bgColor: 'from-rose-400 to-pink-500' },
  { id: 'spellingbee', title: 'Magic Scroll', emoji: '📜', description: 'Spell the magic word to cast the spell!', color: '#FECA57', bgColor: 'from-amber-400 to-yellow-500' },
  { id: 'wordscramble', title: 'Code Breaker', emoji: '🔐', description: 'Decode the enemy\'s scrambled battle codes!', color: '#48DBFB', bgColor: 'from-cyan-400 to-blue-500' },
  { id: 'pictureword', title: "Archer's Shot", emoji: '🏹', description: 'Pick the right word-arrow to hit the target!', color: '#FF9FF3', bgColor: 'from-fuchsia-400 to-pink-500' },
  { id: 'memorycard', title: 'Treasure Hunt', emoji: '💎', description: 'Flip tiles to uncover buried treasure pairs!', color: '#54A0FF', bgColor: 'from-blue-400 to-indigo-500' },
  { id: 'fillblank', title: 'Battle Cry', emoji: '⚔️', description: 'Complete the warrior\'s battle cry to charge!', color: '#5F27CD', bgColor: 'from-violet-400 to-purple-600' },
  { id: 'wordsearch', title: 'Recon Mission', emoji: '🔭', description: 'Scan the jungle grid for hidden targets!', color: '#01A3A4', bgColor: 'from-teal-400 to-emerald-500' },
  { id: 'hangman', title: 'Dragon Rescue', emoji: '🐲', description: 'Guess letters to break the dragon\'s spell!', color: '#F368E0', bgColor: 'from-fuchsia-500 to-rose-500' },
  { id: 'speedtyping', title: 'Race Pit Stop', emoji: '🏎️', description: 'Type fast to keep your race car fuelled!', color: '#FF6348', bgColor: 'from-orange-400 to-red-500' },
  { id: 'listening', title: 'Radio Signal', emoji: '📻', description: 'Decode the secret HQ transmission!', color: '#2ED573', bgColor: 'from-emerald-400 to-green-500' },
  { id: 'sentencebuilder', title: 'Race Strategy', emoji: '🏁', description: 'Order the race plan to win the championship!', color: '#EF4444', bgColor: 'from-red-500 to-orange-600' },
  { id: 'grammarblast', title: 'Cannon Blast', emoji: '💣', description: 'Load the right cannonball to blast the fort!', color: '#8B5CF6', bgColor: 'from-violet-500 to-purple-700' },
  { id: 'categorysort', title: 'Army Barracks', emoji: '🪖', description: 'Sort word-soldiers into the right battalions!', color: '#059669', bgColor: 'from-emerald-600 to-green-800' },
  { id: 'phonicsrocket', title: 'Rocket Launch', emoji: '🚀', description: 'Find the fuel word to blast off into space!', color: '#7C3AED', bgColor: 'from-indigo-600 to-violet-900' },
  { id: 'comprehensionmap', title: 'Quest Journal', emoji: '🗺️', description: 'Read the quest log and answer to advance!', color: '#D97706', bgColor: 'from-amber-500 to-yellow-700' },
  { id: 'jetfighter', title: 'Jet Strike', emoji: '✈️', description: 'Tap green targets — dodge red ones!', color: '#0284C7', bgColor: 'from-sky-500 to-blue-700' },
  { id: 'targetblast', title: 'UFO Blast', emoji: '🛸', description: 'Blast the UFO carrying the word you hear!', color: '#0EA5E9', bgColor: 'from-sky-400 to-indigo-600' },
  { id: 'troopmarch', title: 'Word Army', emoji: '🪖', description: 'Recruit tanks to your base — become a General!', color: '#16A34A', bgColor: 'from-green-500 to-emerald-700' },
  { id: 'rocketlaunch', title: 'Mission Blast Off', emoji: '🚀', description: 'Fuel the rocket and fly to the moon!', color: '#F97316', bgColor: 'from-orange-400 to-red-600' },
  { id: 'racerwords', title: 'Turbo Word Race', emoji: '🏁', description: 'Boost your race car with the right words!', color: '#DC2626', bgColor: 'from-red-500 to-rose-700' },
  { id: 'treasuremap', title: 'Pirate Quest', emoji: '🏴‍☠️', description: 'Answer, then sail your pirate to the treasure!', color: '#D97706', bgColor: 'from-amber-400 to-orange-600' },
]
