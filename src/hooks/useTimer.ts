import { useEffect, useRef } from 'react'
import { useTimerStore } from '../store/timerStore'

export function useTimer(): void {
  const status = useTimerStore((s) => s.status)
  const tick = useTimerStore((s) => s.tick)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => tick(), 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status, tick])
}
