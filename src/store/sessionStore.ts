import { create } from 'zustand'
import type { SubjectRow, SessionRow, DailyStat, WeeklyStat, WeeklySubjectStat, GoalRow } from '../types/electron'

interface SessionState {
  subjects: SubjectRow[]
  sessions: SessionRow[]
  dailyStats: DailyStat[]
  weeklyStats: WeeklyStat[]
  weeklySubjectStats: WeeklySubjectStat[]
  monthlyStats: DailyStat[]
  goals: GoalRow[]

  setSubjects: (subjects: SubjectRow[]) => void
  updateSubject: (id: number, name: string, color: string, deadline: number | null) => void
  removeSubject: (id: number) => void

  setSessions: (sessions: SessionRow[]) => void
  setDailyStats: (stats: DailyStat[]) => void
  setWeeklyStats: (stats: WeeklyStat[]) => void
  setWeeklySubjectStats: (stats: WeeklySubjectStat[]) => void
  setMonthlyStats: (stats: DailyStat[]) => void
  setGoals: (goals: GoalRow[]) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  subjects: [],
  sessions: [],
  dailyStats: [],
  weeklyStats: [],
  weeklySubjectStats: [],
  monthlyStats: [],
  goals: [],

  setSubjects: (subjects) => set({ subjects }),
  updateSubject: (id, name, color, deadline) =>
    set((s) => ({
      subjects: s.subjects.map((sub) => (sub.id === id ? { ...sub, name, color, deadline } : sub))
    })),
  removeSubject: (id) =>
    set((s) => ({ subjects: s.subjects.filter((sub) => sub.id !== id) })),

  setSessions: (sessions) => set({ sessions }),
  setDailyStats: (dailyStats) => set({ dailyStats }),
  setWeeklyStats: (weeklyStats) => set({ weeklyStats }),
  setWeeklySubjectStats: (weeklySubjectStats) => set({ weeklySubjectStats }),
  setMonthlyStats: (monthlyStats) => set({ monthlyStats }),
  setGoals: (goals) => set({ goals })
}))
