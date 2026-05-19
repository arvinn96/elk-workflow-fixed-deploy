import { cn } from '@/lib/utils'
import type { Role } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'

const ROLE_CONFIG: Record<Role, { text: string; bg: string; border: string }> = {
  super_admin: { text: 'text-yellow-700',  bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  admin:       { text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  approval:    { text: 'text-brand-700',   bg: 'bg-brand-50',   border: 'border-brand-200' },
  hod:         { text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  user:        { text: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-300' },
  ucd:         { text: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200' },
}

interface RoleBadgeProps {
  role: Role
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
