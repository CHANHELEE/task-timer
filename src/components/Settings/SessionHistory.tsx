import { useState, useEffect, useCallback } from 'react'
import { useSessionStore } from '../../store/sessionStore'
import type { SessionRow } from '../../types/electron'

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '0:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
}

interface SessionItemProps {
  session: SessionRow
  subjectName: string
  subjectColor: string
  onDelete: (id: number) => void
  onMemoSave: (id: number, memo: string | null) => void
}

function SessionItem({ session, subjectName, subjectColor, onDelete, onMemoSave }: SessionItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(session.memo ?? '')

  const handleSave = async () => {
    const memo = draft.trim() || null
    await onMemoSave(session.id, memo)
    setEditing(false)
  }

  const handleCancel = () => {
    setDraft(session.memo ?? '')
    setEditing(false)
  }

  return (
    <div className="session-history-item">
      <div className="session-history-row">
        <span className="session-history-dot" style={{ background: subjectColor }} />
        <span className="session-history-subject">{subjectName}</span>
        <span className="session-history-time">{formatTime(session.started_at)}</span>
        <span className="session-history-duration">{formatDuration(session.actual_seconds)}</span>
        <div className="session-history-actions">
          <button onClick={() => setEditing(true)} disabled={editing}>메모</button>
          <button className="btn-delete" onClick={() => onDelete(session.id)}>삭제</button>
        </div>
      </div>

      {!editing && session.memo && (
        <div className="session-history-memo" onClick={() => setEditing(true)}>
          {session.memo}
        </div>
      )}

      {editing && (
        <div className="session-history-memo-edit">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="메모를 입력하세요"
            rows={2}
            autoFocus
          />
          <div className="session-memo-actions">
            <button onClick={handleSave}>저장</button>
            <button onClick={handleCancel}>취소</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function SessionHistory({ daysBack }: { daysBack: number | null }) {
  const subjects = useSessionStore((s) => s.subjects)
  const [sessions, setSessions] = useState<SessionRow[]>([])

  const loadSessions = useCallback(async (days: number | null) => {
    const now = Math.floor(Date.now() / 1000)
    const from = days !== null ? now - days * 86400 : 0
    const data = await window.api.session.listFinished({ from, to: now + 86400 })
    setSessions(data)
  }, [])

  useEffect(() => {
    loadSessions(daysBack)
  }, [daysBack, loadSessions])

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return
    await window.api.session.delete({ sessionId: id })
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  const handleMemoSave = async (id: number, memo: string | null) => {
    await window.api.session.updateMemo({ sessionId: id, memo })
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, memo } : s)))
  }

  const subjectMap = new Map(subjects.map((s) => [s.id, s]))

  // Group sessions by date
  const groups: { date: string; items: SessionRow[] }[] = []
  for (const session of sessions) {
    const dateStr = new Date(session.started_at * 1000).toISOString().split('T')[0]
    const last = groups[groups.length - 1]
    if (last && last.date === dateStr) {
      last.items.push(session)
    } else {
      groups.push({ date: dateStr, items: [session] })
    }
  }

  return (
    <div className="session-history">
      <div className="session-history-header">
        <h3>세션 기록</h3>
      </div>

      {sessions.length === 0 ? (
        <p className="session-history-empty">기록된 세션이 없습니다.</p>
      ) : (
        groups.map(({ date, items }) => (
          <div key={date} className="session-history-group">
            <div className="session-history-date">{formatDateLabel(date)}</div>
            {items.map((session) => {
              const subject = subjectMap.get(session.subject_id)
              return (
                <SessionItem
                  key={session.id}
                  session={session}
                  subjectName={subject?.name ?? '삭제된 과목'}
                  subjectColor={subject?.color ?? '#666'}
                  onDelete={handleDelete}
                  onMemoSave={handleMemoSave}
                />
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
