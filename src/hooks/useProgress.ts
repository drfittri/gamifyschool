import { useState, useCallback, useEffect } from 'react'
import type { GameStats } from '../utils/types'
import { XP_PER_ANSWER, STREAK_BONUS, PERFECT_BONUS } from '../utils/types'

const STORAGE_KEY = 'gamifyschool_stats'

const defaultStats: GameStats = {
  xp: 0, level: 1, streak: 0, maxStreak: 0,
  lessonsCompleted: 0, perfectScores: 0, totalCorrect: 0, totalAnswered: 0,
  badges: [], lastPlayed: '',
}

export function useProgress() {
  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...defaultStats, ...JSON.parse(stored) } : defaultStats
    } catch { return defaultStats }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  }, [stats])

  const addCorrectAnswer = useCallback(() => {
    setStats(s => ({
      ...s,
      xp: s.xp + XP_PER_ANSWER + (s.streak >= 3 ? STREAK_BONUS : 0),
      streak: s.streak + 1,
      maxStreak: Math.max(s.maxStreak, s.streak + 1),
      totalCorrect: s.totalCorrect + 1,
      totalAnswered: s.totalAnswered + 1,
      lastPlayed: new Date().toISOString(),
    }))
  }, [])

  const addWrongAnswer = useCallback(() => {
    setStats(s => ({
      ...s, streak: 0, totalAnswered: s.totalAnswered + 1,
      lastPlayed: new Date().toISOString(),
    }))
  }, [])

  const addPerfectScore = useCallback(() => {
    setStats(s => ({
      ...s, xp: s.xp + PERFECT_BONUS,
      perfectScores: s.perfectScores + 1,
    }))
  }, [])

  const completeLesson = useCallback(() => {
    setStats(s => ({
      ...s, lessonsCompleted: s.lessonsCompleted + 1,
      streak: 0,
    }))
  }, [])

  const awardBadge = useCallback((badgeId: string) => {
    setStats(s => s.badges.includes(badgeId) ? s : { ...s, badges: [...s.badges, badgeId] })
  }, [])

  const resetProgress = useCallback(() => {
    setStats(defaultStats)
  }, [])

  return { stats, addCorrectAnswer, addWrongAnswer, addPerfectScore, completeLesson, awardBadge, resetProgress }
}
