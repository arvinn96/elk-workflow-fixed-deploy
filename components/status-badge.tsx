import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { RequestStatus } from '@/lib/types'

const STATUS_CONFIG: Record<RequestStatus, { label: string; dot: string; text: string; bg: string }> = {
  pending:   { label: 'Pending',   dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-100/50' },
  approved:  { label: 'Approved',  dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-100/50' },
  rejected:  { label: 'Rejected',  dot: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-100/50' },
  draft:     { label: 'Draft',     dot: 'bg-slate-400',   text: 'text-slate-600',   bg: 'bg-slate-100/80' },
  sprint:    { label: 'Sprint',    dot: 'bg-violet-500',  text: 'text-violet-700',  bg: 'bg-violet-100/50' },
  uat:       { label: 'UAT',       dot: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-100/50' },
  completed: { label: 'Done',      dot: 'bg-teal-500',    text: 'text-teal-700',    bg: 'bg-teal-100/50' },
}

const FALLBACK = { label: 'Pending', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-100/50' }

interface StatusBadgeProps {
  status: RequestStatus
  className?: string
}

export const StatusBadge = memo(function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || FALLBACK
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dot)} />
      {config.label}
    </span>
  )
})
