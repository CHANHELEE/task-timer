import { useTimerStore } from '../../store/timerStore'

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export function TimerDisplay() {
  const elapsed = useTimerStore((s) => s.elapsed)
  const status = useTimerStore((s) => s.status)

  return (
    <div className="timer-display">
      <div className={`timer-time ${status === 'paused' ? 'paused' : ''}`}>
        {formatTime(elapsed)}
      </div>
    </div>
  )
}
