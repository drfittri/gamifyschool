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
  { id: 'wordmatch', title: 'Word Match', emoji: '🔤', description: 'Match words to their pictures!', color: '#FF6B6B', bgColor: 'from-rose-400 to-pink-500' },
  { id: 'spellingbee', title: 'Spelling Bee', emoji: '🐝', description: 'Spell the words correctly!', color: '#FECA57', bgColor: 'from-amber-400 to-yellow-500' },
  { id: 'wordscramble', title: 'Word Scramble', emoji: '🔀', description: 'Unscramble the letters!', color: '#48DBFB', bgColor: 'from-cyan-400 to-blue-500' },
  { id: 'pictureword', title: 'Picture Word', emoji: '🖼️', description: 'Pick the right word for each picture!', color: '#FF9FF3', bgColor: 'from-fuchsia-400 to-pink-500' },
  { id: 'memorycard', title: 'Memory Cards', emoji: '🃏', description: 'Find matching pairs!', color: '#54A0FF', bgColor: 'from-blue-400 to-indigo-500' },
  { id: 'fillblank', title: 'Fill in the Blank', emoji: '✏️', description: 'Complete the sentence!', color: '#5F27CD', bgColor: 'from-violet-400 to-purple-600' },
  { id: 'wordsearch', title: 'Word Search', emoji: '🔍', description: 'Find hidden words in the grid!', color: '#01A3A4', bgColor: 'from-teal-400 to-emerald-500' },
  { id: 'hangman', title: 'Word Rescue', emoji: '🦸', description: 'Guess the word to save the day!', color: '#F368E0', bgColor: 'from-fuchsia-500 to-rose-500' },
  { id: 'speedtyping', title: 'Speed Type', emoji: '⚡', description: 'Type words before time runs out!', color: '#FF6348', bgColor: 'from-orange-400 to-red-500' },
  { id: 'listening', title: 'Listen & Pick', emoji: '👂', description: 'Hear the word and find the picture!', color: '#2ED573', bgColor: 'from-emerald-400 to-green-500' },
  { id: 'sentencebuilder', title: 'Sentence Builder', emoji: '🏎️', description: 'Build sentences and race your car!', color: '#EF4444', bgColor: 'from-red-500 to-orange-600' },
  { id: 'grammarblast', title: 'Grammar Blast', emoji: '🎯', description: 'Pick the right grammar word!', color: '#8B5CF6', bgColor: 'from-violet-500 to-purple-700' },
  { id: 'categorysort', title: 'Category Sort', emoji: '🪖', description: 'Sort words into groups!', color: '#059669', bgColor: 'from-emerald-600 to-green-800' },
  { id: 'phonicsrocket', title: 'Phonics Rocket', emoji: '🚀', description: 'Find words with the sound!', color: '#7C3AED', bgColor: 'from-indigo-600 to-violet-900' },
  { id: 'comprehensionmap', title: 'Read & Answer', emoji: '🗺️', description: 'Read the story, answer the question!', color: '#D97706', bgColor: 'from-amber-500 to-yellow-700' },
  { id: 'jetfighter', title: 'Jet Fighter', emoji: '✈️', description: 'Catch the right words!', color: '#0284C7', bgColor: 'from-sky-500 to-blue-700' },
]
