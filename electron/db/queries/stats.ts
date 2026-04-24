import { getDb } from '../index'

export interface DailyStat {
  subject_id: number
  subject_name: string
  subject_color: string
  total_seconds: number
}

export interface WeeklyStat {
  date: string
  total_seconds: number
}

export interface WeeklySubjectStat {
  subject_id: number
  subject_name: string
  subject_color: string
  total_seconds: number
}

export function getSubjectTotal(subjectId: number): number {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(actual_seconds), 0) AS total_seconds
       FROM sessions
       WHERE subject_id = ? AND actual_seconds IS NOT NULL`
    )
    .get(subjectId) as { total_seconds: number }
  return row.total_seconds
}

export function getDailyStatForSubject(date: string, subjectId: number): DailyStat | null {
  const db = getDb()
  return (
    db
      .prepare(
        `SELECT s.subject_id,
                sub.name  AS subject_name,
                sub.color AS subject_color,
                SUM(s.actual_seconds) AS total_seconds
         FROM sessions s
         JOIN subjects sub ON sub.id = s.subject_id
         WHERE DATE(s.started_at, 'unixepoch', 'localtime') = ?
           AND s.subject_id = ?
           AND s.actual_seconds IS NOT NULL
         GROUP BY s.subject_id`
      )
      .get(date, subjectId) as DailyStat | null
  ) ?? null
}

export function getDailyStats(date: string): DailyStat[] {
  const db = getDb()
  return db
    .prepare(
      `SELECT s.subject_id,
              sub.name  AS subject_name,
              sub.color AS subject_color,
              SUM(s.actual_seconds) AS total_seconds
       FROM sessions s
       JOIN subjects sub ON sub.id = s.subject_id
       WHERE DATE(s.started_at, 'unixepoch', 'localtime') = ?
         AND s.actual_seconds IS NOT NULL
       GROUP BY s.subject_id`
    )
    .all(date) as DailyStat[]
}

export function getWeeklyStats(weekStart: string): WeeklyStat[] {
  const db = getDb()
  return db
    .prepare(
      `SELECT DATE(started_at, 'unixepoch', 'localtime') AS date,
              SUM(actual_seconds) AS total_seconds
       FROM sessions
       WHERE DATE(started_at, 'unixepoch', 'localtime') >= ?
         AND DATE(started_at, 'unixepoch', 'localtime') < DATE(?, '+7 days')
         AND actual_seconds IS NOT NULL
       GROUP BY date
       ORDER BY date`
    )
    .all(weekStart, weekStart) as WeeklyStat[]
}

export function getWeeklyStatsBySubject(weekStart: string): WeeklySubjectStat[] {
  const db = getDb()
  return db
    .prepare(
      `SELECT s.subject_id,
              sub.name  AS subject_name,
              sub.color AS subject_color,
              SUM(s.actual_seconds) AS total_seconds
       FROM sessions s
       JOIN subjects sub ON sub.id = s.subject_id
       WHERE DATE(s.started_at, 'unixepoch', 'localtime') >= ?
         AND DATE(s.started_at, 'unixepoch', 'localtime') < DATE(?, '+7 days')
         AND s.actual_seconds IS NOT NULL
       GROUP BY s.subject_id`
    )
    .all(weekStart, weekStart) as WeeklySubjectStat[]
}

export function getMonthlyStats(year: number, month: number): DailyStat[] {
  const db = getDb()
  return db
    .prepare(
      `SELECT s.subject_id,
              sub.name  AS subject_name,
              sub.color AS subject_color,
              SUM(s.actual_seconds) AS total_seconds
       FROM sessions s
       JOIN subjects sub ON sub.id = s.subject_id
       WHERE strftime('%Y', s.started_at, 'unixepoch', 'localtime') = ?
         AND strftime('%m', s.started_at, 'unixepoch', 'localtime') = ?
         AND s.actual_seconds IS NOT NULL
       GROUP BY s.subject_id
       ORDER BY sub.created_at`
    )
    .all(String(year), String(month).padStart(2, '0')) as DailyStat[]
}
