import { getDb } from '../index'

export interface SubjectRow {
  id: number
  name: string
  color: string
  created_at: number
  deadline: number | null
}

export function listSubjects(): SubjectRow[] {
  const db = getDb()
  return db.prepare(`SELECT * FROM subjects ORDER BY created_at DESC`).all() as SubjectRow[]
}

export function createSubject(name: string, color: string, deadline: number | null): number {
  const db = getDb()
  const result = db
    .prepare(`INSERT INTO subjects (name, color, created_at, deadline) VALUES (?, ?, ?, ?)`)
    .run(name, color, Math.floor(Date.now() / 1000), deadline)
  return result.lastInsertRowid as number
}

export function updateSubject(id: number, name: string, color: string, deadline: number | null): void {
  const db = getDb()
  db.prepare(`UPDATE subjects SET name = ?, color = ?, deadline = ? WHERE id = ?`).run(name, color, deadline, id)
}

export function deleteSubject(id: number): void {
  const db = getDb()
  db.transaction(() => {
    db.prepare(`DELETE FROM goals WHERE subject_id = ?`).run(id)
    db.prepare(`DELETE FROM sessions WHERE subject_id = ?`).run(id)
    db.prepare(`DELETE FROM subjects WHERE id = ?`).run(id)
  })()
}
