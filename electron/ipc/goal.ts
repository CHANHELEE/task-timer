import { ipcMain } from 'electron'
import { z } from 'zod'
import { listGoals, upsertGoal } from '../db/queries/goal'

const UpsertSchema = z.object({
  subjectId: z.number().int().positive().nullable(),
  dailySeconds: z.number().int().nonnegative().nullable()
})

export function registerGoalHandlers(): void {
  ipcMain.handle('goal:list', () => {
    return listGoals()
  })

  ipcMain.handle('goal:upsert', (_, payload) => {
    const { subjectId, dailySeconds } = UpsertSchema.parse(payload)
    upsertGoal(subjectId, dailySeconds)
  })
}
