import { useState, useEffect } from 'react'
import { useTimerStore } from '../../store/timerStore'
import { useSession } from '../../hooks/useSession'
import { useSessionStore } from '../../store/sessionStore'
import type { SubjectRow } from '../../types/electron'

function getDailyPct(
  subjectId: number,
  dailyStats: ReturnType<typeof useSessionStore.getState>['dailyStats'],
  goals: ReturnType<typeof useSessionStore.getState>['goals']
): number | null {
  const goal = goals.find((g) => g.subject_id === subjectId)
  if (!goal?.daily_seconds) return null
  const actual = dailyStats.find((s) => s.subject_id === subjectId)?.total_seconds ?? 0
  return Math.min(Math.floor((actual / goal.daily_seconds) * 100), 100)
}

function isDailyGoalAchieved(pct: number | null): boolean {
  return pct !== null && pct >= 100
}

interface SubjectCardProps {
  subject: SubjectRow
  pct: number | null
  selected: boolean
  onClick: () => void
}

function SubjectCard({ subject, pct, selected, onClick }: SubjectCardProps) {
  return (
    <button
      className={`subject-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="subject-card-top">
        <span className="subject-card-dot" style={{ background: subject.color }} />
        <span className="subject-card-name">{subject.name}</span>
        {pct !== null && (
          <span className="subject-card-pct" style={{ color: pct >= 100 ? '#4AE27A' : '#aaa' }}>
            {pct}%
          </span>
        )}
      </div>
      {pct !== null && (
        <div className="subject-card-bar-track">
          <div
            className="subject-card-bar-fill"
            style={{
              width: `${pct}%`,
              background: pct >= 100 ? '#4AE27A' : subject.color
            }}
          />
        </div>
      )}
    </button>
  )
}

export function TimerControls() {
  const status = useTimerStore((s) => s.status)
  const subjects = useSessionStore((s) => s.subjects)
  const dailyStats = useSessionStore((s) => s.dailyStats)
  const goals = useSessionStore((s) => s.goals)
  const { startSession, pauseSession, resumeSession, finishSession } = useSession()

  const now = Math.floor(Date.now() / 1000)
  const selectableSubjects = subjects.filter((s) => {
    if (s.deadline !== null && s.deadline < now) return false
    const pct = getDailyPct(s.id, dailyStats, goals)
    return !isDailyGoalAchieved(pct)
  })

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)

  useEffect(() => {
    if (selectedSubjectId === null && selectableSubjects.length > 0) {
      setSelectedSubjectId(selectableSubjects[0].id)
    }
    if (
      selectedSubjectId !== null &&
      isDailyGoalAchieved(getDailyPct(selectedSubjectId, dailyStats, goals))
    ) {
      setSelectedSubjectId(selectableSubjects[0]?.id ?? null)
    }
  }, [subjects, dailyStats, goals])

  const handleStart = async () => {
    if (!selectedSubjectId) return
    await startSession(selectedSubjectId)
  }

  if (status === 'idle') {
    if (subjects.length === 0) {
      return (
        <div className="timer-controls">
          <p className="timer-hint">설정 탭에서 과목을 먼저 추가하세요.</p>
        </div>
      )
    }

    if (selectableSubjects.length === 0) {
      return (
        <div className="timer-controls">
          <p className="timer-hint">오늘 설정된 모든 과목의 목표를 달성했습니다! 🎉</p>
        </div>
      )
    }

    return (
      <div className="timer-idle">
        <div className="subject-card-list">
          {selectableSubjects.map((s) => (
            <SubjectCard
              key={s.id}
              subject={s}
              pct={getDailyPct(s.id, dailyStats, goals)}
              selected={selectedSubjectId === s.id}
              onClick={() => setSelectedSubjectId(s.id)}
            />
          ))}
        </div>
        <button
          className="timer-start-btn"
          onClick={handleStart}
          disabled={!selectedSubjectId}
        >
          시작
        </button>
      </div>
    )
  }

  if (status === 'running') {
    return (
      <div className="timer-controls">
        <button onClick={pauseSession}>일시정지</button>
        <button onClick={() => finishSession()}>완료</button>
      </div>
    )
  }

  return (
    <div className="timer-controls">
      <button onClick={resumeSession}>재개</button>
      <button onClick={() => finishSession()}>완료</button>
    </div>
  )
}
