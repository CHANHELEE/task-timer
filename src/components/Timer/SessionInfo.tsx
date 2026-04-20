import { useTimerStore } from '../../store/timerStore'
import { useSessionStore } from '../../store/sessionStore'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}시간 ${m}분` : `${h}시간`
  return `${m}분`
}

export function SessionInfo() {
  const status = useTimerStore((s) => s.status)
  const elapsed = useTimerStore((s) => s.elapsed)
  const subjectId = useTimerStore((s) => s.subjectId)
  const subjects = useSessionStore((s) => s.subjects)
  const dailyStats = useSessionStore((s) => s.dailyStats)
  const goals = useSessionStore((s) => s.goals)

  if (status === 'idle' || subjectId === null) return null

  const subject = subjects.find((s) => s.id === subjectId)
  if (!subject) return null

  const prevTotal = dailyStats.find((s) => s.subject_id === subjectId)?.total_seconds ?? 0
  const todayTotal = prevTotal + elapsed

  const goal = goals.find((g) => g.subject_id === subjectId)
  const dailyGoal = goal?.daily_seconds ?? null

  const pct = dailyGoal ? Math.min((todayTotal / dailyGoal) * 100, 100) : null
  const achieved = dailyGoal !== null && todayTotal >= dailyGoal

  return (
    <div className="session-info">
      <div className="session-info-subject">
        <span className="session-info-dot" style={{ background: subject.color }} />
        <span className="session-info-name">{subject.name}</span>
        {status === 'paused' && <span className="session-info-badge">일시정지</span>}
      </div>

      <div className="session-info-goal">
        <div className="session-info-goal-header">
          <span className="session-info-goal-label">{dailyGoal !== null ? '오늘 목표' : '오늘 학습'}</span>
          <span
            className="session-info-goal-value"
            style={{ color: achieved ? '#4AE27A' : '#ccc' }}
          >
            {formatDuration(todayTotal)}
            {dailyGoal !== null && (
              <span className="session-info-goal-total"> / {formatDuration(dailyGoal)}</span>
            )}
          </span>
          {pct !== null && (
            <span
              className="session-info-goal-pct"
              style={{ color: achieved ? '#4AE27A' : '#888' }}
            >
              {Math.floor(pct)}%
            </span>
          )}
        </div>
        {dailyGoal !== null && (
          <div className="session-info-bar-track">
            <div
              className="session-info-bar-fill"
              style={{
                width: `${pct}%`,
                background: achieved ? '#4AE27A' : subject.color
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
