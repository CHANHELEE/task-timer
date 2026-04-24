import { getDb } from '../index'

export interface GoalRow {
  id: number
  subject_id: number | null
  daily_seconds: number | null
}

export function listGoals(): GoalRow[] {
  const db = getDb()
  return db.prepare(`SELECT id, subject_id, daily_seconds FROM goals`).all() as GoalRow[]
}

export function upsertGoal(subjectId: number | null, dailySeconds: number | null): void {
  const db = getDb()
  if (subjectId === null) {
    // SQLite UNIQUE treats each NULL as distinct, so ON CONFLICT(subject_id) doesn't fire for NULL.
    // DELETE + INSERT in a transaction is the reliable workaround.
    db.transaction(() => {
      db.prepare(`DELETE FROM goals WHERE subject_id IS NULL`).run()
      db.prepare(`INSERT INTO goals (subject_id, daily_seconds) VALUES (NULL, ?)`).run(dailySeconds)
    })()
  } else {
    db.prepare(
      `INSERT INTO goals (subject_id, daily_seconds)
       VALUES (?, ?)
       ON CONFLICT(subject_id) DO UPDATE SET daily_seconds = excluded.daily_seconds`
    ).run(subjectId, dailySeconds)
  }
}
