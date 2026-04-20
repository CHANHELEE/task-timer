import { useSessionStore } from '../../store/sessionStore'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}시간 ${m}분`
  return `${m}분`
}

export function StatsSummary() {
  const dailyStats = useSessionStore((s) => s.dailyStats)
  const weeklyStats = useSessionStore((s) => s.weeklyStats)

  const todayTotal = dailyStats.reduce((acc, s) => acc + s.total_seconds, 0)
  const weekTotal = weeklyStats.reduce((acc, s) => acc + s.total_seconds, 0)

  return (
    <div className="stats-summary">
      <div className="stat-item">
        <span className="stat-label">오늘</span>
        <span className="stat-value">{formatDuration(todayTotal)}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">이번 주</span>
        <span className="stat-value">{formatDuration(weekTotal)}</span>
      </div>
    </div>
  )
}
