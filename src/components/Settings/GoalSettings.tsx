import { useState, useEffect } from 'react'
import { useSessionStore } from '../../store/sessionStore'
import type { GoalRow } from '../../types/electron'

function formatMinutes(seconds: number | null): string {
  if (!seconds) return '없음'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}시간 ${m}분` : `${h}시간`
  return `${m}분`
}

interface SubjectGoalRowProps {
  subjectId: number
  name: string
  color: string
  goal: GoalRow | undefined
  onSave: (subjectId: number, daily: string) => Promise<void>
  saving: boolean
}

function SubjectGoalRow({ subjectId, name, color, goal, onSave, saving }: SubjectGoalRowProps) {
  const [editing, setEditing] = useState(false)
  const [daily, setDaily] = useState(
    goal?.daily_seconds ? String(Math.floor(goal.daily_seconds / 60)) : ''
  )

  useEffect(() => {
    setDaily(goal?.daily_seconds ? String(Math.floor(goal.daily_seconds / 60)) : '')
  }, [goal])

  const handleSave = async () => {
    await onSave(subjectId, daily)
    setEditing(false)
  }

  return (
    <div className="goal-row">
      <div className="goal-row-subject" style={{ borderLeft: `4px solid ${color}` }}>
        <span className="goal-row-name">{name}</span>
        <div className="goal-row-values">
          <span className="goal-tag">{formatMinutes(goal?.daily_seconds ?? null)}</span>
        </div>
        <button className="goal-edit-btn" onClick={() => setEditing((v) => !v)}>
          {editing ? '닫기' : '편집'}
        </button>
      </div>

      {editing && (
        <div className="goal-edit-form">
          <label>
            목표 (분)
            <input
              type="number"
              min={0}
              value={daily}
              placeholder="없음"
              onChange={(e) => setDaily(e.target.value)}
            />
          </label>
          <div className="goal-edit-actions">
            <button disabled={saving} onClick={handleSave}>저장</button>
            <button onClick={() => setEditing(false)}>취소</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function GoalSettings({ daysBack }: { daysBack: number | null }) {
  const allSubjects = useSessionStore((s) => s.subjects)
  const fromTs = daysBack !== null ? Math.floor(Date.now() / 1000) - daysBack * 86400 : null
  const subjects = fromTs !== null ? allSubjects.filter((s) => s.created_at >= fromTs) : allSubjects
  const [goals, setGoals] = useState<GoalRow[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.api.goal.list().then(setGoals)
  }, [])

  const getGoal = (subjectId: number) => goals.find((g) => g.subject_id === subjectId)

  const handleSave = async (subjectId: number, dailyMinutes: string) => {
    setSaving(true)
    await window.api.goal.upsert({
      subjectId,
      dailySeconds: dailyMinutes ? parseInt(dailyMinutes) * 60 : null
    })
    const updated = await window.api.goal.list()
    setGoals(updated)
    setSaving(false)
  }

  return (
    <div className="goal-settings">
      <h3>목표 설정</h3>
      {subjects.length === 0 ? (
        <p className="goal-empty">과목을 먼저 추가하세요.</p>
      ) : (
        <div className="goal-list">
          {subjects.map((s) => (
            <SubjectGoalRow
              key={s.id}
              subjectId={s.id}
              name={s.name}
              color={s.color}
              goal={getGoal(s.id)}
              onSave={handleSave}
              saving={saving}
            />
          ))}
        </div>
      )}
    </div>
  )
}
