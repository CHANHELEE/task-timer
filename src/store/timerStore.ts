import { create } from 'zustand'

type TimerStatus = 'idle' | 'running' | 'paused'

interface TimerState {
  status: TimerStatus
  elapsed: number
  activeSessionId: number | null
  subjectId: number | null
  subjectPrevTotal: number

  start: (subjectId: number, sessionId: number, prevTotal: number) => void
  pause: () => void
  resume: () => void
  tick: () => void
  stop: () => void
  setElapsed: (elapsed: number) => void
}

export const useTimerStore = create<TimerState>((set) => ({
  status: 'idle',
  elapsed: 0,
  activeSessionId: null,
  subjectId: null,
  subjectPrevTotal: 0,

  start: (subjectId, sessionId, prevTotal) =>
    set({ status: 'running', elapsed: 0, activeSessionId: sessionId, subjectId, subjectPrevTotal: prevTotal }),

  pause: () => set({ status: 'paused' }),

  resume: () => set({ status: 'running' }),

  tick: () => set((s) => ({ elapsed: s.elapsed + 1 })),

  stop: () => set({ status: 'idle', elapsed: 0, activeSessionId: null, subjectId: null, subjectPrevTotal: 0 }),

  setElapsed: (elapsed) => set({ elapsed })
}))
