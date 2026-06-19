import type { StatusVariant } from '@/types'

interface StatusBadgeProps {
  variant: StatusVariant
  label?: string
}

const config: Record<StatusVariant, { dot: string; text: string; bg: string; label: string }> = {
  signed: {
    dot: 'bg-primary-500',
    text: 'text-primary-700',
    bg: 'bg-primary-50',
    label: 'Signed',
  },
  pending: {
    dot: 'bg-warning-500',
    text: 'text-warning-700',
    bg: 'bg-warning-50',
    label: 'Pending',
  },
  overdue: {
    dot: 'bg-error-500',
    text: 'text-error-700',
    bg: 'bg-error-50',
    label: 'Overdue',
  },
  inactive: {
    dot: 'bg-neutral-400',
    text: 'text-neutral-600',
    bg: 'bg-neutral-100',
    label: 'Inactive',
  },
}

export default function StatusBadge({ variant, label }: StatusBadgeProps) {
  const c = config[variant]

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium font-body',
        c.bg,
        c.text,
      ].join(' ')}
    >
      <span className={['w-1.5 h-1.5 rounded-full', c.dot].join(' ')} />
      {label ?? c.label}
    </span>
  )
}
