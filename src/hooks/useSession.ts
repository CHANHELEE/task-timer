import { useTimerStore } from '../store/timerStore'
import { useSessionStore } from '../store/sessionStore'

export function useSession() {
  const timerStore = useTimerStore()
  const setSubjects = useSessionStore((s) => s.setSubjects)
  const removeSubject = useSessionStore((s) => s.removeSubject)
  const updateSubjectInStore = useSessionStore((s) => s.updateSubject)
  const setMonthlyStats = useSessionStore((s) => s.setMonthlyStats)


  async function startSession(subjectId: number): Promise<void> {
    const startedAt = Math.floor(Date.now() / 1000)
    const sessionId = await window.api.session.create({ subjectId, targetSeconds: null, startedAt })
    timerStore.start(subjectId, sessionId)
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
    timerStore.stop()
    const now = new Date()
    const monthly = await window.api.stats.monthly({ year: now.getFullYear(), month: now.getMonth() + 1 })
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
