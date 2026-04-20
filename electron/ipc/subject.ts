import { ipcMain } from 'electron'
import { z } from 'zod'
import { listSubjects, createSubject, updateSubject, deleteSubject } from '../db/queries/subject'

const deadline = z.number().int().positive().nullable()

const CreateSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  deadline
})

const UpdateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  deadline
})

const DeleteSchema = z.object({
  id: z.number().int().positive()
})

export function registerSubjectHandlers(): void {
  ipcMain.handle('subject:list', () => {
    return listSubjects()
  })

  ipcMain.handle('subject:create', (_, payload) => {
    const { name, color, deadline } = CreateSchema.parse(payload)
    return createSubject(name, color, deadline)
  })

  ipcMain.handle('subject:update', (_, payload) => {
    const { id, name, color, deadline } = UpdateSchema.parse(payload)
    updateSubject(id, name, color, deadline)
  })

  ipcMain.handle('subject:delete', (_, payload) => {
    const { id } = DeleteSchema.parse(payload)
    deleteSubject(id)
  })
}
