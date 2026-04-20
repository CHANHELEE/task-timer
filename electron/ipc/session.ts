import { ipcMain } from 'electron'
import { z } from 'zod'
import {
  createSession,
  pauseSession,
  resumeSession,
  finishSession,
  listSessions,
  findUnfinishedSession,
  discardSession,
  updateSessionMemo,
  listFinishedSessions,
  hideSession
} from '../db/queries/session'

const CreateSchema = z.object({
  subjectId: z.number().int().positive(),
  targetSeconds: z.number().int().positive().nullable(),
  startedAt: z.number().int().positive()
})

const PauseSchema = z.object({
  sessionId: z.number().int().positive(),
  pausedAt: z.number().int().positive()
})

const ResumeSchema = z.object({
  sessionId: z.number().int().positive(),
  now: z.number().int().positive()
})

const FinishSchema = z.object({
  sessionId: z.number().int().positive(),
  endedAt: z.number().int().positive(),
  memo: z.string().optional()
})

const ListSchema = z.object({
  from: z.number().int().positive(),
  to: z.number().int().positive()
})

export function registerSessionHandlers(): void {
  ipcMain.handle('session:create', (_, payload) => {
    const { subjectId, targetSeconds, startedAt } = CreateSchema.parse(payload)
    return createSession(subjectId, targetSeconds, startedAt)
  })

  ipcMain.handle('session:pause', (_, payload) => {
    const { sessionId, pausedAt } = PauseSchema.parse(payload)
    pauseSession(sessionId, pausedAt)
  })

  ipcMain.handle('session:resume', (_, payload) => {
    const { sessionId, now } = ResumeSchema.parse(payload)
    resumeSession(sessionId, now)
  })

  ipcMain.handle('session:finish', (_, payload) => {
    const { sessionId, endedAt, memo } = FinishSchema.parse(payload)
    finishSession(sessionId, endedAt, memo)
  })

  ipcMain.handle('session:list', (_, payload) => {
    const { from, to } = ListSchema.parse(payload)
    return listSessions(from, to)
  })

  ipcMain.handle('session:findUnfinished', () => {
    return findUnfinishedSession()
  })

  ipcMain.handle('session:discard', (_, payload) => {
    const { sessionId } = z.object({ sessionId: z.number().int().positive() }).parse(payload)
    discardSession(sessionId)
  })

  ipcMain.handle('session:updateMemo', (_, payload) => {
    const { sessionId, memo } = z
      .object({ sessionId: z.number().int().positive(), memo: z.string().nullable() })
      .parse(payload)
    updateSessionMemo(sessionId, memo)
  })

  ipcMain.handle('session:delete', (_, payload) => {
    const { sessionId } = z.object({ sessionId: z.number().int().positive() }).parse(payload)
    hideSession(sessionId)
  })

  ipcMain.handle('session:listFinished', (_, payload) => {
    const { from, to } = ListSchema.parse(payload)
    return listFinishedSessions(from, to)
  })
}
