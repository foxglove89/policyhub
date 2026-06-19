import { useEffect, useState } from 'react'

interface ProgressRingProps {
  size?: number
  strokeWidth?: number
  progress: number
  color?: string
  trackColor?: string
}

export default function ProgressRing({
  size = 64,
  strokeWidth = 6,
  progress,
  color = '#22c55e',
  trackColor = '#e7e5e4',
}: ProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedProgress = Math.min(100, Math.max(0, progress))
  const offset = circumference - (animatedProgress / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(clampedProgress)
    }, 200)
    return () => clearTimeout(timer)
  }, [clampedProgress])

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-[800ms] ease-out"
        />
      </svg>
      <span
        className="absolute font-display text-sm font-semibold"
        style={{ color }}
      >
        {Math.round(clampedProgress)}%
      </span>
    </div>
  )
}
