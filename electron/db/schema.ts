export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS subjects (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  color      TEXT    NOT NULL DEFAULT '#4A90E2',
  created_at INTEGER NOT NULL,
  deadline   INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id      INTEGER NOT NULL REFERENCES subjects(id),
  started_at      INTEGER NOT NULL,
  ended_at        INTEGER,
  target_seconds  INTEGER,
  actual_seconds  INTEGER,
  paused_seconds  INTEGER NOT NULL DEFAULT 0,
  paused_at       INTEGER,
  memo            TEXT
);

CREATE TABLE IF NOT EXISTS goals (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id     INTEGER UNIQUE REFERENCES subjects(id),
  daily_seconds  INTEGER,
  weekly_seconds INTEGER
);
`
