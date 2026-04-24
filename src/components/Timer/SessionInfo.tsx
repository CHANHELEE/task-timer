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
  const subjectPrevTotal = useTimerStore((s) => s.subjectPrevTotal)
  const subjects = useSessionStore((s) => s.subjects)
  const goals = useSessionStore((s) => s.goals)

  if (status === 'idle' || subjectId === null) return null

  const subject = subjects.find((s) => s.id === subjectId)
  if (!subject) return null

  const total = subjectPrevTotal + elapsed

  const goal = goals.find((g) => g.subject_id === subjectId)
  const goalSeconds = goal?.daily_seconds ?? null

  const pct = goalSeconds ? Math.min((total / goalSeconds) * 100, 100) : null
  const achieved = goalSeconds !== null && total >= goalSeconds

  return (
    <div className="session-info">
      <div className="session-info-subject">
        <span className="session-info-dot" style={{ background: subject.color }} />
        <span className="session-info-name">{subject.name}</span>
        {status === 'paused' && <span className="session-info-badge">일시정지</span>}
      </div>

      <div className="session-info-goal">
        <div className="session-info-goal-header">
          <span className="session-info-goal-label">{goalSeconds !== null ? '목표' : '누적'}</span>
          <span
            className="session-info-goal-value"
            style={{ color: achieved ? '#4AE27A' : '#ccc' }}
          >
            {formatDuration(total)}
            {goalSeconds !== null && (
              <span className="session-info-goal-total"> / {formatDuration(goalSeconds)}</span>
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
        {goalSeconds !== null && (
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
