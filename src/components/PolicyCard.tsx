import { useNavigate } from 'react-router-dom'
import type { Policy, StatusVariant } from '@/types'
import StatusBadge from './StatusBadge'
import ProgressRing from './ProgressRing'

interface PolicyCardProps {
  policy: Policy
  status?: StatusVariant
  progress?: number
  onSign?: (policy: Policy) => void
}

export default function PolicyCard({ policy, status = 'pending', progress, onSign }: PolicyCardProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/policies/${policy.id}`)}
      className="bg-white rounded-xl border border-neutral-200 p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-neutral-300 hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/policies/${policy.id}`) }}
    >
      {/* Top row: Category + Status */}
      <div className="flex items-start justify-between mb-3">
        <span className="inline-flex items-center px-3 py-1 rounded-md text-[11px] font-medium font-body bg-accent-500 text-white">
          {policy.category}
        </span>
        <StatusBadge variant={status} />
      </div>

      {/* Title */}
      <h3 className="font-display text-[22px] font-semibold text-neutral-800 leading-tight mb-2 line-clamp-2">
        {policy.title}
      </h3>

      {/* Meta */}
      <p className="text-sm font-body text-neutral-400 mb-4">
        Last updated {new Date(policy.last_updated).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </p>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        {progress !== undefined ? (
          <ProgressRing size={40} strokeWidth={4} progress={progress} />
        ) : (
          <span className="text-xs font-body text-neutral-400">
            v{policy.version}
          </span>
        )}

        {onSign && status === 'pending' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSign(policy)
            }}
            className="px-4 py-2 rounded-lg bg-accent-600 text-white text-sm font-body font-medium hover:bg-accent-700 transition-colors duration-150"
          >
            Sign Now
          </button>
        )}
      </div>
    </div>
  )
}
