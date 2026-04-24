export interface SubjectRow {
  id: number
  name: string
  color: string
  created_at: number
  deadline: number | null
}

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

export interface GoalRow {
  id: number
  subject_id: number | null
  daily_seconds: number | null
}

declare global {
  interface Window {
    api: {
      session: {
        create: (payload: {
          subjectId: number
          targetSeconds: number | null
          startedAt: number
        }) => Promise<number>
        pause: (payload: { sessionId: number; pausedAt: number }) => Promise<void>
        resume: (payload: { sessionId: number; now: number }) => Promise<void>
        finish: (payload: { sessionId: number; endedAt: number; memo?: string }) => Promise<void>
        list: (payload: { from: number; to: number }) => Promise<SessionRow[]>
        findUnfinished: () => Promise<SessionRow | undefined>
        discard: (payload: { sessionId: number }) => Promise<void>
        updateMemo: (payload: { sessionId: number; memo: string | null }) => Promise<void>
        delete: (payload: { sessionId: number }) => Promise<void>
        listFinished: (payload: { from: number; to: number }) => Promise<SessionRow[]>
      }
      stats: {
        daily: (payload: { date: string }) => Promise<DailyStat[]>
        subjectTotal: (payload: { subjectId: number }) => Promise<number>
        dailyForSubject: (payload: { date: string; subjectId: number }) => Promise<DailyStat | null>
        weekly: (payload: { weekStart: string }) => Promise<WeeklyStat[]>
        weeklyBySubject: (payload: { weekStart: string }) => Promise<WeeklySubjectStat[]>
        monthly: (payload: { year: number; month: number }) => Promise<DailyStat[]>
      }
      subject: {
        list: () => Promise<SubjectRow[]>
        create: (payload: { name: string; color: string; deadline: number | null }) => Promise<number>
        update: (payload: { id: number; name: string; color: string; deadline: number | null }) => Promise<void>
        delete: (payload: { id: number }) => Promise<void>
      }
      goal: {
        list: () => Promise<GoalRow[]>
        upsert: (payload: {
          subjectId: number | null
          dailySeconds: number | null
        }) => Promise<void>
      }
      window: {
        setCompact: (compact: boolean) => Promise<void>
      }
    }
  }
}
