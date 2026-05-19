import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { RequestType } from '@/lib/types'
import { Calendar, FileText, FolderKanban } from 'lucide-react'

const TYPE_CONFIG: Record<RequestType, { label: string; icon: React.ComponentType<{ className?: string }>; text: string; bg: string }> = {
  project:  { label: 'Request', icon: FileText, text: 'text-violet-700', bg: 'bg-violet-100/50' },
  document: { label: 'Request', icon: FileText, text: 'text-sky-700',    bg: 'bg-sky-100/50' },
  leave:    { label: 'Request', icon: FileText, text: 'text-amber-700',  bg: 'bg-amber-100/50' },
}

const FALLBACK = { label: 'Request', icon: FileText, text: 'text-slate-700', bg: 'bg-slate-100/50' }

interface TypeBadgeProps {
  type: RequestType
  className?: string
}

export const TypeBadge = memo(function TypeBadge({ type, className }: TypeBadgeProps) {
  const config = TYPE_CONFIG[type] || FALLBACK
  const Icon = config.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
        config.bg,
        config.text,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  )
})
