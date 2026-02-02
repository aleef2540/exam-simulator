'use client'
import { useEffect, useState } from 'react'

type Props = {
  startedAt: string
  duration: number // วินาที
  onTimeUp: () => void
}

export default function ExamTimer({
  startedAt,
  duration,
  onTimeUp,
}: Props) {
  const [remaining, setRemaining] = useState(duration)

  useEffect(() => {
    const start = new Date(startedAt).getTime()

    const interval = setInterval(() => {
      const now = Date.now()
      const passed = Math.floor((now - start) / 1000)
      const left = duration - passed

      if (left <= 0) {
        setRemaining(0)
        clearInterval(interval)
        onTimeUp()
      } else {
        setRemaining(left)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, []) // ✅ ไม่มี deps ใด ๆ

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div className="text-center text-xl font-semibold mb-4">
      ⏰ {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  )
}
