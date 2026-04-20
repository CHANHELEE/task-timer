import { getDb } from '../index'

export interface SessionRow {
  id: number
  subject_id: number
  started_at: number
  ended_at: number | null
  target_seconds: number | null
  actual_seconds: number | null
  paused_seconds: number
  paused_at: number | null
  memo: string | null
}

export function createSession(
  subjectId: number,
  targetSeconds: number | null,
  startedAt: number
): number {
  const db = getDb()
  const stmt = db.prepare(
    `INSERT INTO sessions (subject_id, target_seconds, started_at) VALUES (?, ?, ?)`
  )
  const result = stmt.run(subjectId, targetSeconds, startedAt)
  return result.lastInsertRowid as number
}

export function pauseSession(sessionId: number, pausedAt: number): void {
  const db = getDb()
  db.prepare(`UPDATE sessions SET paused_at = ? WHERE id = ? AND paused_at IS NULL`).run(
    pausedAt,
    sessionId
  )
}

export function resumeSession(sessionId: number, now: number): void {
  const db = getDb()
  const row = db
    .prepare(`SELECT paused_at, paused_seconds FROM sessions WHERE id = ?`)
    .get(sessionId) as { paused_at: number; paused_seconds: number } | undefined
  if (!row || row.paused_at == null) return

  const added = now - row.paused_at
  db.prepare(
    `UPDATE sessions SET paused_seconds = paused_seconds + ?, paused_at = NULL WHERE id = ?`
  ).run(added, sessionId)
}

export function finishSession(sessionId: number, endedAt: number, memo?: string): void {
  const db = getDb()
  const row = db
    .prepare(`SELECT started_at, paused_seconds, paused_at FROM sessions WHERE id = ?`)
    .get(sessionId) as
    | { started_at: number; paused_seconds: number; paused_at: number | null }
    | undefined
  if (!row) return

  let totalPaused = row.paused_seconds
  if (row.paused_at != null) {
    totalPaused += endedAt - row.paused_at
  }
  const actualSeconds = endedAt - row.started_at - totalPaused

  db.prepare(
    `UPDATE sessions SET ended_at = ?, actual_seconds = ?, paused_seconds = ?, paused_at = NULL, memo = ? WHERE id = ?`
  ).run(endedAt, actualSeconds, totalPaused, memo ?? null, sessionId)
}

export function listSessions(from: number, to: number): SessionRow[] {
  const db = getDb()
  return db
    .prepare(
      `SELECT * FROM sessions WHERE started_at >= ? AND started_at < ? ORDER BY started_at DESC`
    )
    .all(from, to) as SessionRow[]
}

export function findUnfinishedSession(): SessionRow | undefined {
  const db = getDb()
  return db
    .prepare(`SELECT * FROM sessions WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1`)
    .get() as SessionRow | undefined
}

export function discardSession(sessionId: number): void {
  const db = getDb()
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId)
}

export function updateSessionMemo(sessionId: number, memo: string | null): void {
  const db = getDb()
  db.prepare(`UPDATE sessions SET memo = ? WHERE id = ?`).run(memo, sessionId)
}

export function hideSession(sessionId: number): void {
  const db = getDb()
  db.prepare(`UPDATE sessions SET hidden = 1 WHERE id = ?`).run(sessionId)
}

export function listFinishedSessions(from: number, to: number): SessionRow[] {
  const db = getDb()
  return db
    .prepare(
      `SELECT * FROM sessions WHERE ended_at IS NOT NULL AND hidden = 0 AND started_at >= ? AND started_at < ? ORDER BY started_at DESC`
    )
    .all(from, to) as SessionRow[]
}
