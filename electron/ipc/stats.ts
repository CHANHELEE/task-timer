import { ipcMain } from 'electron'
import { z } from 'zod'
import { getDailyStats, getWeeklyStats, getWeeklyStatsBySubject } from '../db/queries/stats'

const DailySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

const WeeklySchema = z.object({
  year: z.number().int().positive(),
  week: z.number().int().min(0).max(53)
})

export function registerStatsHandlers(): void {
  ipcMain.handle('stats:daily', (_, payload) => {
    const { date } = DailySchema.parse(payload)
    return getDailyStats(date)
  })

  ipcMain.handle('stats:weekly', (_, payload) => {
    const { year, week } = WeeklySchema.parse(payload)
    return getWeeklyStats(year, week)
  })

  ipcMain.handle('stats:weeklyBySubject', (_, payload) => {
    const { year, week } = WeeklySchema.parse(payload)
    return getWeeklyStatsBySubject(year, week)
  })
}
