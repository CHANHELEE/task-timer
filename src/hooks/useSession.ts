import { useTimerStore } from '../store/timerStore'
import { useSessionStore } from '../store/sessionStore'

export function useSession() {
  const timerStore = useTimerStore()
  const setSubjects = useSessionStore((s) => s.setSubjects)
  const removeSubject = useSessionStore((s) => s.removeSubject)
  const updateSubjectInStore = useSessionStore((s) => s.updateSubject)
  const updateDailyStat = useSessionStore((s) => s.updateDailyStat)
  const setMonthlyStats = useSessionStore((s) => s.setMonthlyStats)


  async function startSession(subjectId: number): Promise<void> {
    const startedAt = Math.floor(Date.now() / 1000)
    const [sessionId, prevTotal] = await Promise.all([
      window.api.session.create({ subjectId, targetSeconds: null, startedAt }),
      window.api.stats.subjectTotal({ subjectId })
    ])
    timerStore.start(subjectId, sessionId, prevTotal)
  }

  async function pauseSession(): Promise<void> {
    if (!timerStore.activeSessionId) return
    const pausedAt = Math.floor(Date.now() / 1000)
    await window.api.session.pause({ sessionId: timerStore.activeSessionId, pausedAt })
    timerStore.pause()
  }

  async function resumeSession(): Promise<void> {
    if (!timerStore.activeSessionId) return
    const now = Math.floor(Date.now() / 1000)
    await window.api.session.resume({ sessionId: timerStore.activeSessionId, now })
    timerStore.resume()
  }

  async function finishSession(memo?: string): Promise<void> {
    if (!timerStore.activeSessionId) return
    const endedAt = Math.floor(Date.now() / 1000)
    await window.api.session.finish({ sessionId: timerStore.activeSessionId, endedAt, memo })
    const finishedSubjectId = timerStore.subjectId!
    timerStore.stop()
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    const [dailyStat, monthly] = await Promise.all([
      window.api.stats.dailyForSubject({ date: dateStr, subjectId: finishedSubjectId }),
      window.api.stats.monthly({ year, month: now.getMonth() + 1 })
    ])
    if (dailyStat) updateDailyStat(dailyStat)
    setMonthlyStats(monthly)
  }

  async function createSubject(name: string, color: string, deadline: number | null): Promise<void> {
    await window.api.subject.create({ name, color, deadline })
    const subjects = await window.api.subject.list()
    setSubjects(subjects)
  }

  async function deleteSubject(id: number): Promise<void> {
    await window.api.subject.delete({ id })
    removeSubject(id)
  }

  async function updateSubject(id: number, name: string, color: string, deadline: number | null): Promise<void> {
    await window.api.subject.update({ id, name, color, deadline })
    updateSubjectInStore(id, name, color, deadline)
  }

  return { startSession, pauseSession, resumeSession, finishSession, createSubject, deleteSubject, updateSubject }
}
