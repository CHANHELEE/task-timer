import { useState } from 'react'
import { useSessionStore } from '../../store/sessionStore'
import { useSession } from '../../hooks/useSession'

const PRESET_COLORS = ['#4A90E2', '#E24A4A', '#4AE27A', '#E2C94A', '#9B4AE2', '#E24AAA']

const d = new Date()
const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function toDateString(ts: number | null): string {
  if (!ts) return ''
  return new Date(ts * 1000).toISOString().split('T')[0]
}

function toTimestamp(dateStr: string): number | null {
  if (!dateStr) return null
  // 날짜 자정 (로컬 기준) → UNIX timestamp
  const d = new Date(dateStr)
  d.setHours(23, 59, 59, 0)
  return Math.floor(d.getTime() / 1000)
}

function DeadlineBadge({ deadline }: { deadline: number | null }) {
  if (!deadline) return null
  const now = Math.floor(Date.now() / 1000)
  const expired = deadline < now
  const dateStr = new Date(deadline * 1000).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  return (
    <span className={`deadline-badge ${expired ? 'expired' : ''}`}>
      {expired ? '만료 ' : '~'}{dateStr}
    </span>
  )
}

export function SubjectManager({ daysBack }: { daysBack: number | null }) {
  const allSubjects = useSessionStore((s) => s.subjects)
  const { createSubject, updateSubject, deleteSubject } = useSession()

  const fromTs = daysBack !== null ? Math.floor(Date.now() / 1000) - daysBack * 86400 : null
  const subjects = fromTs !== null ? allSubjects.filter((s) => s.created_at >= fromTs) : allSubjects

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editDeadline, setEditDeadline] = useState('')

  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [newDeadline, setNewDeadline] = useState('')

  const startEdit = (id: number, name: string, color: string, deadline: number | null) => {
    setIsAdding(false)
    setEditingId(id)
    setEditName(name)
    setEditColor(color)
    setEditDeadline(toDateString(deadline))
  }

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return
    await updateSubject(editingId, editName.trim(), editColor, toTimestamp(editDeadline))
    setEditingId(null)
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    await createSubject(newName.trim(), newColor, toTimestamp(newDeadline))
    setNewName('')
    setNewColor(PRESET_COLORS[0])
    setNewDeadline('')
    setIsAdding(false)
  }

  const handleStartAdding = () => {
    setEditingId(null)
    setIsAdding(true)
  }

  return (
    <div className="subject-manager">
      <h3>과목 관리</h3>
      <ul>
        {subjects.map((s) => (
          <li key={s.id}>
            {editingId === s.id ? (
              <div className="edit-row edit-row--col">
                <div className="edit-row-inline">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="과목 이름"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                  />
                  <div className="color-picker">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        style={{ background: c, outline: editColor === c ? '2px solid #fff' : 'none' }}
                        onClick={() => setEditColor(c)}
                      />
                    ))}
                  </div>
                </div>
                <div className="edit-row-deadline">
                  <label>마감 기한</label>
                  <input
                    type="date"
                    min={today}
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                  />
                  {editDeadline && (
                    <button className="btn-clear-date" onClick={() => setEditDeadline('')}>✕</button>
                  )}
                </div>
                <div className="edit-row-actions">
                  <button onClick={handleUpdate}>저장</button>
                  <button onClick={() => setEditingId(null)}>취소</button>
                </div>
              </div>
            ) : (
              <div className="subject-row" style={{ borderLeft: `4px solid ${s.color}` }}>
                <span className="subject-row-name">{s.name}</span>
                <DeadlineBadge deadline={s.deadline} />
                <div className="subject-row-actions">
                  <button onClick={() => startEdit(s.id, s.name, s.color, s.deadline)}>편집</button>
                  <button onClick={() => { if (window.confirm('정말 삭제하시겠습니까?')) deleteSubject(s.id) }}>삭제</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {isAdding ? (
        <div className="edit-row edit-row--col">
          <div className="edit-row-inline">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="과목 이름"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <div className="color-picker">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  style={{ background: c, outline: newColor === c ? '2px solid #fff' : 'none' }}
                  onClick={() => setNewColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="edit-row-deadline">
            <label>마감 기한</label>
            <input
              type="date"
              min={today}
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
            />
            {newDeadline && (
              <button className="btn-clear-date" onClick={() => setNewDeadline('')}>✕</button>
            )}
          </div>
          <div className="edit-row-actions">
            <button onClick={handleAdd}>추가</button>
            <button onClick={() => setIsAdding(false)}>취소</button>
          </div>
        </div>
      ) : (
        <button className="btn-add-subject" onClick={handleStartAdding}>+ 과목 추가</button>
      )}
    </div>
  )
}
