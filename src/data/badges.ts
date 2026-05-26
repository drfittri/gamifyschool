import type { Badge } from '../utils/types'

export const BADGES: Badge[] = [
  {
    id: 'first_game', name: 'First Steps!', icon: '🌟',
    description: 'Play your very first game!',
    conditionMet: (s) => s.totalAnswered > 0,
  },
  {
    id: 'xp_100', name: 'Star Student', icon: '⭐',
    description: 'Earn 100 XP',
    conditionMet: (s) => s.xp >= 100,
  },
  {
    id: 'xp_500', name: 'Super Learner', icon: '🏆',
    description: 'Earn 500 XP',
    conditionMet: (s) => s.xp >= 500,
  },
  {
    id: 'xp_1000', name: 'Knowledge Champion', icon: '👑',
    description: 'Earn 1000 XP',
    conditionMet: (s) => s.xp >= 1000,
  },
  {
    id: 'streak_3', name: 'On Fire!', icon: '🔥',
    description: 'Get a streak of 3 correct answers',
    conditionMet: (s) => s.maxStreak >= 3,
  },
  {
    id: 'streak_7', name: 'Unstoppable!', icon: '⚡',
    description: 'Get a streak of 7 correct answers',
    conditionMet: (s) => s.maxStreak >= 7,
  },
  {
    id: 'streak_10', name: 'Perfect Machine!', icon: '🤖',
    description: 'Get a streak of 10 correct answers',
    conditionMet: (s) => s.maxStreak >= 10,
  },
  {
    id: 'perfect_1', name: 'Perfect Score!', icon: '💎',
    description: 'Get all answers right in a game',
    conditionMet: (s) => s.perfectScores >= 1,
  },
  {
    id: 'perfect_5', name: 'Perfectionist!', icon: '💫',
    description: 'Get 5 perfect scores',
    conditionMet: (s) => s.perfectScores >= 5,
  },
  {
    id: 'unit_1', name: 'Hello Master', icon: '👋',
    description: 'Complete the Hello unit',
    conditionMet: (s) => s.lessonsCompleted >= 1,
  },
  {
    id: 'unit_5', name: 'Lesson Explorer', icon: '🗺️',
    description: 'Complete 5 units',
    conditionMet: (s) => s.lessonsCompleted >= 5,
  },
  {
    id: 'unit_all', name: 'English Champion!', icon: '🎓',
    description: 'Complete all 10 units!',
    conditionMet: (s) => s.lessonsCompleted >= 10,
  },
  {
    id: 'all_games', name: 'Game Master', icon: '🎮',
    description: 'Play every type of game',
    conditionMet: (s) => s.totalAnswered >= 100,
  },
  {
    id: 'level_5', name: 'Level 5 Hero', icon: '🦸',
    description: 'Reach Level 5',
    conditionMet: (s) => s.xp >= 420,
  },
  {
    id: 'level_10', name: 'Level 10 Legend', icon: '🐉',
    description: 'Reach Level 10',
    conditionMet: (s) => s.xp >= 1300,
  },
]
