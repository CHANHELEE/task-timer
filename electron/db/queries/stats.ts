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

export function getWeeklyStats(year: number, week: number): WeeklyStat[] {
  const db = getDb()
  // SQLite: strftime('%W') returns week number (00-53, Sun start)
  // We use %W and filter by year
  return db
    .prepare(
      `SELECT DATE(started_at, 'unixepoch', 'localtime') AS date,
              SUM(actual_seconds) AS total_seconds
       FROM sessions
       WHERE strftime('%Y', started_at, 'unixepoch', 'localtime') = ?
         AND strftime('%W', started_at, 'unixepoch', 'localtime') = ?
         AND actual_seconds IS NOT NULL
       GROUP BY date
       ORDER BY date`
    )
    .all(String(year), String(week).padStart(2, '0')) as WeeklyStat[]
}

export function getWeeklyStatsBySubject(year: number, week: number): WeeklySubjectStat[] {
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
         AND strftime('%W', s.started_at, 'unixepoch', 'localtime') = ?
         AND s.actual_seconds IS NOT NULL
       GROUP BY s.subject_id`
    )
    .all(String(year), String(week).padStart(2, '0')) as WeeklySubjectStat[]
}
