import { useState, useEffect } from 'react'
import { useTimer } from './hooks/useTimer'
import { useSessionStore } from './store/sessionStore'
import { useTimerStore } from './store/timerStore'
import { TimerDisplay } from './components/Timer/TimerDisplay'
import { TimerControls } from './components/Timer/TimerControls'
import { SessionInfo } from './components/Timer/SessionInfo'
import { DailyChart } from './components/Stats/DailyChart'
import { WeeklyChart } from './components/Stats/WeeklyChart'
import { StatsSummary } from './components/Stats/StatsSummary'
import { GoalProgress } from './components/Stats/GoalProgress'
import { SubjectManager } from './components/Settings/SubjectManager'
import { GoalSettings } from './components/Settings/GoalSettings'
import { SessionHistory } from './components/Settings/SessionHistory'
import { CrashRecovery } from './components/CrashRecovery'

type Tab = 'timer' | 'stats' | 'settings'
type DaysBack = 7 | 30 | 90 | null

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

function getLocalDateString(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekStartDate(d: Date): string {
  const date = new Date(d)
  const day = date.getDay() // 0=일, 1=월, ...
  date.setDate(date.getDate() - day) // 해당 주 일요일로 이동
  return getLocalDateString(date)
}

export default function App() {
  useTimer()
  const [tab, setTab] = useState<Tab>('timer')
  const [settingsDays, setSettingsDays] = useState<DaysBack>(7)
  const [isTimerDataReady, setIsTimerDataReady] = useState(false)
  const [timerDataError, setTimerDataError] = useState<string | null>(null)
  const [isCompact, setIsCompact] = useState(false)
  const setSubjects = useSessionStore((s) => s.setSubjects)
  const setDailyStats = useSessionStore((s) => s.setDailyStats)
  const setWeeklyStats = useSessionStore((s) => s.setWeeklyStats)
  const setGoals = useSessionStore((s) => s.setGoals)
  const setWeeklySubjectStats = useSessionStore((s) => s.setWeeklySubjectStats)
  const setMonthlyStats = useSessionStore((s) => s.setMonthlyStats)
  const subjects = useSessionStore((s) => s.subjects)
  const monthlyStats = useSessionStore((s) => s.monthlyStats)
  const goals = useSessionStore((s) => s.goals)
  const elapsed = useTimerStore((s) => s.elapsed)
  const timerStatus = useTimerStore((s) => s.status)
  const subjectId = useTimerStore((s) => s.subjectId)
  const activeSubject = subjects.find((s) => s.id === subjectId) ?? null

  const enterCompact = async () => {
    await window.api.window.setCompact(true)
    setIsCompact(true)
  }

  const exitCompact = async () => {
    await window.api.window.setCompact(false)
    setIsCompact(false)
  }

  // 앱 시작 시 타이머 탭에 필요한 데이터 로드
  useEffect(() => {
    let mounted = true
    const now = new Date()
    const dateStr = getLocalDateString(now)
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    Promise.all([
      window.api.subject.list(),
      window.api.stats.daily({ date: dateStr }),
      window.api.goal.list(),
      window.api.stats.monthly({ year, month })
    ]).then(([subjects, daily, goals, monthly]) => {
      if (!mounted) return
      setSubjects(subjects)
      setDailyStats(daily)
      setGoals(goals)
      setMonthlyStats(monthly)
      setTimerDataError(null)
      setIsTimerDataReady(true)
    }).catch(() => {
      if (!mounted) return
      setTimerDataError('타이머 데이터를 불러오지 못했습니다.')
      setIsTimerDataReady(true)
    })

    return () => {
      mounted = false
    }
  }, [setSubjects, setDailyStats, setGoals, setMonthlyStats])

  // 통계 탭 진입 시 주간 데이터 추가 로드
  useEffect(() => {
    if (tab !== 'stats') return
    const now = new Date()
    const dateStr = getLocalDateString(now)
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const weekStart = getWeekStartDate(now)
    Promise.all([
      window.api.stats.daily({ date: dateStr }),
      window.api.stats.weekly({ weekStart }),
      window.api.stats.weeklyBySubject({ weekStart }),
      window.api.goal.list(),
      window.api.stats.monthly({ year, month })
    ]).then(([daily, weekly, weeklyBySubject, goals, monthly]) => {
      setDailyStats(daily)
      setWeeklyStats(weekly)
      setWeeklySubjectStats(weeklyBySubject)
      setGoals(goals)
      setMonthlyStats(monthly)
    })
  }, [tab, setDailyStats, setWeeklyStats, setWeeklySubjectStats, setGoals, setMonthlyStats])

  if (isCompact) {
    const prevTotal = monthlyStats.find((s) => s.subject_id === subjectId)?.total_seconds ?? 0
    const totalWithCurrent = prevTotal + elapsed
    const dailyGoal = goals.find((g) => g.subject_id === subjectId)?.daily_seconds ?? null
    const pct = dailyGoal ? Math.min((totalWithCurrent / dailyGoal) * 100, 100) : null
    const achieved = dailyGoal !== null && totalWithCurrent >= dailyGoal

    return (
      <div className="compact-widget">
        {activeSubject && (
          <span className="compact-dot" style={{ background: activeSubject.color }} />
        )}
        <span className="compact-subject-name">{activeSubject?.name ?? ''}</span>
        {pct === null ? (
          <span className={`compact-time${timerStatus === 'paused' ? ' paused' : ''}`}>
            {formatTime(elapsed)}
          </span>
        ) : (
          <>
            <span className={`compact-time compact-time--sm${timerStatus === 'paused' ? ' paused' : ''}`}>
              {formatTime(elapsed)}
            </span>
            <span className="compact-pct" style={{ color: achieved ? '#4AE27A' : '#888' }}>
              {Math.floor(pct)}%
            </span>
          </>
        )}
        <button className="compact-restore-btn" onClick={exitCompact} title="복원">
          ⊞
        </button>
        {pct !== null && (
          <div className="compact-bar">
            <div
              className="compact-bar-fill"
              style={{
                width: `${pct}%`,
                background: achieved ? '#4AE27A' : (activeSubject?.color ?? '#4a90e2')
              }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="app">
      <CrashRecovery />
      <nav className="tab-nav">
        <button className={tab === 'timer' ? 'active' : ''} onClick={() => setTab('timer')}>
          타이머
        </button>
        <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>
          통계
        </button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          설정
        </button>
        {tab === 'timer' && (
          <button className="btn-compact" onClick={enterCompact} title="미니 타이머">
            ⊟
          </button>
        )}
      </nav>

      <main className="app-content">
        {tab === 'timer' && (
          <div className="timer-page">
            <TimerDisplay />
            {!isTimerDataReady && (
              <div className="timer-loading" role="status" aria-label="타이머 데이터 로딩 중">
                <div className="timer-loading-bar" />
              </div>
            )}
            {isTimerDataReady && timerDataError !== null && (
              <div className="timer-controls">
                <p className="timer-hint">{timerDataError}</p>
              </div>
            )}
            {isTimerDataReady && timerDataError === null && (
              <>
                <TimerControls />
                <SessionInfo />
              </>
            )}
          </div>
        )}

        {tab === 'stats' && (
          <div className="stats-page">
            <StatsSummary />
            <GoalProgress />
            <DailyChart />
            <WeeklyChart />
          </div>
        )}

        {tab === 'settings' && (
          <div className="settings-page">
            <div className="settings-filter">
              <span className="settings-filter-label">조회 기간</span>
              <div className="settings-filter-tabs">
                {([7, 30, 90, null] as DaysBack[]).map((d) => (
                  <button
                    key={d ?? 'all'}
                    className={settingsDays === d ? 'active' : ''}
                    onClick={() => setSettingsDays(d)}
                  >
                    {d === null ? '전체' : `최근 ${d}일`}
                  </button>
                ))}
              </div>
            </div>
            <SubjectManager daysBack={settingsDays} />
            <GoalSettings daysBack={settingsDays} />
            <SessionHistory daysBack={settingsDays} />
          </div>
        )}
      </main>
    </div>
  )
}
