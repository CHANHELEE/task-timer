import { useSessionStore } from '../../store/sessionStore'
import type { GoalRow } from '../../types/electron'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}시간 ${m}분`
  return `${m}분`
}

interface ProgressBarProps {
  actual: number
  goal: number
  color: string
}

function ProgressBar({ actual, goal, color }: ProgressBarProps) {
  const pct = goal > 0 ? Math.min((actual / goal) * 100, 100) : 0
  const achieved = actual >= goal
  return (
    <div className="gp-bar-track">
      <div
        className="gp-bar-fill"
        style={{ width: `${pct}%`, background: achieved ? '#4AE27A' : color }}
      />
    </div>
  )
}

interface GoalRowProps {
  label: string
  color: string
  actualDaily: number
  goalDaily: number | null
  actualWeekly: number
  goalWeekly: number | null
}

function GoalRowItem({ label, color, actualDaily, goalDaily, actualWeekly, goalWeekly }: GoalRowProps) {
  const hasDaily = goalDaily != null && goalDaily > 0
  const hasWeekly = goalWeekly != null && goalWeekly > 0
  if (!hasDaily && !hasWeekly) return null

  return (
    <div className="gp-row">
      <div className="gp-label">
        <span className="gp-dot" style={{ background: color }} />
        <span>{label}</span>
      </div>
      <div className="gp-bars">
        {hasDaily && (
          <div className="gp-bar-group">
            <div className="gp-bar-header">
              <span className="gp-period">오늘</span>
              <span className="gp-time" style={{ color: actualDaily >= goalDaily! ? '#4AE27A' : '#ccc' }}>
                {formatDuration(actualDaily)}
                <span className="gp-goal-time"> / {formatDuration(goalDaily!)}</span>
              </span>
              <span className="gp-pct" style={{ color: actualDaily >= goalDaily! ? '#4AE27A' : '#888' }}>
                {Math.min(Math.floor((actualDaily / goalDaily!) * 100), 100)}%
              </span>
            </div>
            <ProgressBar actual={actualDaily} goal={goalDaily!} color={color} />
          </div>
        )}
        {hasWeekly && (
          <div className="gp-bar-group">
            <div className="gp-bar-header">
              <span className="gp-period">이번 주</span>
              <span className="gp-time" style={{ color: actualWeekly >= goalWeekly! ? '#4AE27A' : '#ccc' }}>
                {formatDuration(actualWeekly)}
                <span className="gp-goal-time"> / {formatDuration(goalWeekly!)}</span>
              </span>
              <span className="gp-pct" style={{ color: actualWeekly >= goalWeekly! ? '#4AE27A' : '#888' }}>
                {Math.min(Math.floor((actualWeekly / goalWeekly!) * 100), 100)}%
              </span>
            </div>
            <ProgressBar actual={actualWeekly} goal={goalWeekly!} color={color} />
          </div>
        )}
      </div>
    </div>
  )
}

export function GoalProgress() {
  const dailyStats = useSessionStore((s) => s.dailyStats)
  const weeklyStats = useSessionStore((s) => s.weeklyStats)
  const weeklySubjectStats = useSessionStore((s) => s.weeklySubjectStats)
  const goals = useSessionStore((s) => s.goals)
  const subjects = useSessionStore((s) => s.subjects)

  if (goals.length === 0) return null

  const todayTotal = dailyStats.reduce((acc, s) => acc + s.total_seconds, 0)
  const weekTotal = weeklyStats.reduce((acc, s) => acc + s.total_seconds, 0)

  const getGoal = (subjectId: number | null): GoalRow | undefined =>
    goals.find((g) => g.subject_id === subjectId)

  const overallGoal = getGoal(null)
  const hasOverallGoal = overallGoal && (overallGoal.daily_seconds || overallGoal.weekly_seconds)

  const subjectsWithGoals = subjects.filter((sub) => {
    const g = getGoal(sub.id)
    return g && (g.daily_seconds || g.weekly_seconds)
  })

  if (!hasOverallGoal && subjectsWithGoals.length === 0) return null

  return (
    <div className="gp-section">
      <h3 className="gp-title">목표 달성 현황</h3>

      {hasOverallGoal && (
        <GoalRowItem
          label="전체"
          color="#4A90E2"
          actualDaily={todayTotal}
          goalDaily={overallGoal!.daily_seconds}
          actualWeekly={weekTotal}
          goalWeekly={overallGoal!.weekly_seconds}
        />
      )}

      {subjectsWithGoals.map((sub) => {
        const g = getGoal(sub.id)!
        const dailyStat = dailyStats.find((s) => s.subject_id === sub.id)
        const weeklyStat = weeklySubjectStats.find((s) => s.subject_id === sub.id)
        return (
          <GoalRowItem
            key={sub.id}
            label={sub.name}
            color={sub.color}
            actualDaily={dailyStat?.total_seconds ?? 0}
            goalDaily={g.daily_seconds}
            actualWeekly={weeklyStat?.total_seconds ?? 0}
            goalWeekly={g.weekly_seconds}
          />
        )
      })}
    </div>
  )
}
