import { useEffect, useState } from 'react'
import { MOCK_DURATION_SECONDS } from '../data/mockData'
import type { SessionStatus } from '../types'

export function useBuildSession() {
  const [status, setStatus] = useState<SessionStatus>('ready')
  const [seconds, setSeconds] = useState(MOCK_DURATION_SECONDS)

  useEffect(() => {
    if (status !== 'running' || seconds <= 0) return
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [status, seconds])

  const sessionStatus = status === 'running' && seconds === 0 ? 'finished' : status

  return {
    status: sessionStatus,
    seconds,
    start: () => setStatus('running'),
    pause: () => setStatus('paused'),
    resume: () => setStatus('running'),
    finish: () => setStatus('finished'),
    reset: () => { setStatus('ready'); setSeconds(MOCK_DURATION_SECONDS) },
  }
}
