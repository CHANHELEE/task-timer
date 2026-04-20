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
  actual: number
  goalDaily: number | null
  goalWeekly: number | null
}

function GoalRowItem({ label, color, actual, goalDaily, goalWeekly }: GoalRowProps) {
  const hasDaily = goalDaily != null && goalDaily > 0
  const hasWeekly = goalWeekly != null && goalWeekly > 0
  if (!hasDaily && !hasWeekly) return null

  const goal = hasDaily ? goalDaily! : goalWeekly!

  return (
    <div className="gp-row">
      <div className="gp-label">
        <span className="gp-dot" style={{ background: color }} />
        <span>{label}</span>
      </div>
      <div className="gp-bars">
        <div className="gp-bar-group">
          <div className="gp-bar-header">
            <span className="gp-period">이번 달</span>
            <span className="gp-time" style={{ color: actual >= goal ? '#4AE27A' : '#ccc' }}>
              {formatDuration(actual)}
              <span className="gp-goal-time"> / {formatDuration(goal)}</span>
            </span>
            <span className="gp-pct" style={{ color: actual >= goal ? '#4AE27A' : '#888' }}>
              {Math.min(Math.floor((actual / goal) * 100), 100)}%
            </span>
          </div>
          <ProgressBar actual={actual} goal={goal} color={color} />
        </div>
      </div>
    </div>
  )
}

export function GoalProgress() {
  const monthlyStats = useSessionStore((s) => s.monthlyStats)
  const goals = useSessionStore((s) => s.goals)
  const subjects = useSessionStore((s) => s.subjects)

  if (goals.length === 0) return null

  const monthlyTotal = monthlyStats.reduce((acc, s) => acc + s.total_seconds, 0)

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
      <h3 className="gp-title">이번달 목표 달성 현황</h3>

      {hasOverallGoal && (
        <GoalRowItem
          label="전체"
          color="#4A90E2"
          actual={monthlyTotal}
          goalDaily={overallGoal!.daily_seconds}
          goalWeekly={overallGoal!.weekly_seconds}
        />
      )}

      {subjectsWithGoals.map((sub) => {
        const g = getGoal(sub.id)!
        const stat = monthlyStats.find((s) => s.subject_id === sub.id)
        return (
          <GoalRowItem
            key={sub.id}
            label={sub.name}
            color={sub.color}
            actual={stat?.total_seconds ?? 0}
            goalDaily={g.daily_seconds}
            goalWeekly={g.weekly_seconds}
          />
        )
      })}
    </div>
  )
}
