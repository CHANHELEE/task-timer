import { VictoryLine, VictoryChart, VictoryAxis, VictoryScatter } from 'victory'
import { useSessionStore } from '../../store/sessionStore'

const axisStyle = {
  axis: { stroke: '#3a3a5a' },
  tickLabels: { fill: '#aaa', fontSize: 11 },
  grid: { stroke: '#2a2a4a', strokeDasharray: '4' }
}

const DAY_LABELS: Record<string, string> = {
  '0': '일', '1': '월', '2': '화', '3': '수', '4': '목', '5': '금', '6': '토'
}

export function WeeklyChart() {
  const weeklyStats = useSessionStore((s) => s.weeklyStats)

  if (weeklyStats.length === 0) {
    return <div className="chart-empty">이번 주 학습 기록이 없습니다.</div>
  }

  const data = weeklyStats.map((s) => {
    const d = new Date(s.date)
    const dayOfWeek = String(d.getDay())
    return {
      x: DAY_LABELS[dayOfWeek] ?? s.date,
      y: Math.round(s.total_seconds / 60)
    }
  })

  return (
    <div className="chart-container">
      <h3>이번 주 일별 학습</h3>
      <VictoryChart height={250}>
        <VictoryAxis style={axisStyle} />
        <VictoryAxis dependentAxis tickFormat={(t) => `${Math.round(t)}분`} style={axisStyle} />
        <VictoryLine data={data} style={{ data: { stroke: '#4A90E2' } }} />
        <VictoryScatter data={data} size={4} style={{ data: { fill: '#4A90E2' } }} />
      </VictoryChart>
    </div>
  )
}
