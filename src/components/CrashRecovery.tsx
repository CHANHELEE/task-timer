import { useEffect, useState } from 'react'
import { useTimerStore } from '../store/timerStore'
import { useSessionStore } from '../store/sessionStore'
import type { SessionRow } from '../types/electron'

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export function CrashRecovery() {
  const [unfinished, setUnfinished] = useState<SessionRow | null>(null)
  const subjects = useSessionStore((s) => s.subjects)
  const timerStore = useTimerStore()

  useEffect(() => {
    if (timerStore.status !== 'idle') return
    window.api.session.findUnfinished().then((session) => {
      if (session) setUnfinished(session)
    })
  }, [])

  if (!unfinished) return null

  const subject = subjects.find((s) => s.id === unfinished.subject_id)
  const elapsed = Math.floor(Date.now() / 1000) - unfinished.started_at - unfinished.paused_seconds

  const handleResume = async () => {
    const now = Math.floor(Date.now() / 1000)
    if (unfinished.paused_at != null) {
      await window.api.session.resume({ sessionId: unfinished.id, now })
    }
    timerStore.start(unfinished.subject_id, unfinished.id)
    timerStore.setElapsed(Math.max(elapsed, 0))
    setUnfinished(null)
  }

  const handleDiscard = async () => {
    const now = Math.floor(Date.now() / 1000)
    await window.api.session.finish({ sessionId: unfinished.id, endedAt: now })
    setUnfinished(null)
  }

  return (
    <div className="crash-overlay">
      <div className="crash-dialog">
        <h2>이전 세션 복구</h2>
        <p>
          앱이 비정상 종료됐습니다. 진행 중이던 세션이 있습니다.
        </p>
        <div className="crash-info">
          <span className="crash-subject">{subject?.name ?? '알 수 없는 과목'}</span>
          <span className="crash-elapsed">{formatTime(Math.max(elapsed, 0))}</span>
        </div>
        <div className="crash-actions">
          <button className="btn-primary" onClick={handleResume}>
            이어서 하기
          </button>
          <button className="btn-secondary" onClick={handleDiscard}>
            취소 (세션 종료)
          </button>
        </div>
      </div>
    </div>
  )
}
