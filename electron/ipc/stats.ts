import { ipcMain } from 'electron'
import { z } from 'zod'
import { getDailyStats, getWeeklyStats, getWeeklyStatsBySubject, getMonthlyStats } from '../db/queries/stats'

const DailySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

const WeeklySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

export function registerStatsHandlers(): void {
  ipcMain.handle('stats:daily', (_, payload) => {
    const { date } = DailySchema.parse(payload)
    return getDailyStats(date)
  })

  ipcMain.handle('stats:weekly', (_, payload) => {
    const { weekStart } = WeeklySchema.parse(payload)
    return getWeeklyStats(weekStart)
  })

  ipcMain.handle('stats:weeklyBySubject', (_, payload) => {
    const { weekStart } = WeeklySchema.parse(payload)
    return getWeeklyStatsBySubject(weekStart)
  })

  ipcMain.handle('stats:monthly', (_, payload) => {
    const { year, month } = z.object({
      year: z.number().int().positive(),
      month: z.number().int().min(1).max(12)
    }).parse(payload)
    return getMonthlyStats(year, month)
  })
}
