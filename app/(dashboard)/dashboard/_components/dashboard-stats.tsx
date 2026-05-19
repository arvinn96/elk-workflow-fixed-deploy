import { getSuperAdminDashboardData } from '@/lib/supabase/dashboard-data'
import type { Profile } from '@/lib/types'
import { 
  Mail, Search, ClipboardList, CheckCircle2,
  Zap, Clock, CircleCheck,
} from 'lucide-react'

const ICON_MAP = {
  mail: Mail, search: Search, clipboard: ClipboardList,
  check: CheckCircle2, zap: Zap, clock: Clock, circle: CircleCheck,
}

export async function DashboardStats({ profile }: { profile: Profile }) {
  const { stats: data } = await getSuperAdminDashboardData(profile)

  const statCards = [
    { label: 'INBOX',            value: data.inbox ?? 0,            iconKey: 'mail',      color: '#6366f1' },
    { label: 'GROOMING',         value: data.grooming ?? 0,         iconKey: 'search',    color: '#8b5cf6' },
    { label: 'PENDING APPROVAL', value: data.pending_approval ?? 0, iconKey: 'clipboard', color: '#f97316' },
    { label: 'APPROVED',         value: data.approved ?? 0,         iconKey: 'check',     color: '#10b981' },
    { label: 'IN SPRINT',        value: data.in_sprint ?? 0,        iconKey: 'zap',       color: '#f59e0b' },
    { label: 'IN UAT',           value: data.in_uat ?? 0,           iconKey: 'clock',     color: '#3b82f6' },
    { label: 'DONE',             value: data.done ?? 0,             iconKey: 'circle',    color: '#14b8a6' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
      {statCards.map(({ label, value, color, iconKey }) => {
        const Icon = ICON_MAP[iconKey as keyof typeof ICON_MAP]
        return (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-tight">{label}</span>
              <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                <Icon className="h-3.5 w-3.5" style={{ color }} strokeWidth={2.5} />
              </div>
            </div>
            <span className="text-3xl font-black text-slate-900 tabular-nums leading-none">{value}</span>
          </div>
        )
      })}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-2 w-16 bg-slate-100 rounded" />
            <div className="h-7 w-7 bg-slate-50 rounded-lg" />
          </div>
          <div className="h-8 w-10 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  )
}
