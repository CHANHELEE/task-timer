import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { SCHEMA_SQL } from './schema'

let db: Database.Database

export function initDb(): void {
  const dbPath = join(app.getPath('userData'), 'study-timer.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA_SQL)
  runMigrations()
}

function runMigrations(): void {
  const subjectCols = db.pragma('table_info(subjects)') as { name: string }[]
  if (!subjectCols.some((c) => c.name === 'deadline')) {
    db.exec(`ALTER TABLE subjects ADD COLUMN deadline INTEGER`)
  }

  const sessionCols = db.pragma('table_info(sessions)') as { name: string }[]
  if (!sessionCols.some((c) => c.name === 'hidden')) {
    db.exec(`ALTER TABLE sessions ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0`)
  }
}

export function getDb(): Database.Database {
  if (!db) throw new Error('DB not initialized')
  return db
}
