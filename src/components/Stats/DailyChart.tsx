import { VictoryBar, VictoryChart, VictoryAxis, VictoryTooltip } from 'victory'
import { useSessionStore } from '../../store/sessionStore'

const axisStyle = {
  axis: { stroke: '#3a3a5a' },
  tickLabels: { fill: '#aaa', fontSize: 11 },
  grid: { stroke: '#2a2a4a', strokeDasharray: '4' }
}

function formatMinutes(seconds: number): string {
  return `${Math.floor(seconds / 60)}분`
}

export function DailyChart() {
  const dailyStats = useSessionStore((s) => s.dailyStats)

  if (dailyStats.length === 0) {
    return <div className="chart-empty">오늘 학습 기록이 없습니다.</div>
  }

  const data = dailyStats.map((s) => ({
    x: s.subject_name,
    y: Math.round(s.total_seconds / 60),
    fill: s.subject_color,
    label: formatMinutes(s.total_seconds)
  }))

  return (
    <div className="chart-container">
      <h3>오늘 과목별 학습</h3>
      <VictoryChart domainPadding={30} height={250}>
        <VictoryAxis style={axisStyle} />
        <VictoryAxis dependentAxis tickFormat={(t) => `${Math.round(t)}분`} style={axisStyle} />
        <VictoryBar
          data={data}
          style={{ data: { fill: ({ datum }) => datum.fill } }}
          labelComponent={<VictoryTooltip style={{ fill: '#fff', fontSize: 11 }} flyoutStyle={{ fill: '#2a2a4a', stroke: '#3a3a5a' }} />}
        />
      </VictoryChart>
    </div>
  )
}
