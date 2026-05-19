import { createClient } from '@/lib/supabase/server'
import { Clock, CheckCircle, XCircle, BarChart2 } from 'lucide-react'

export async function HodDashboardStats({ userId }: { userId: string }) {
  const supabase = await createClient()

  // PROFESSIONALLY use the new consolidated HOD Stats RPC for maximum speed.
  const { data: statsRaw } = await supabase.rpc('get_hod_dashboard_stats', { p_user_id: userId })
  
  const s = statsRaw as any || { queue_count: 0, approved_me: 0, rejected_me: 0, total_handled: 0 }

  const stats = [
    { label: 'Awaiting My Review', value: s.queue_count, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    { label: 'Approved by Me', value: s.approved_me, icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    { label: 'Rejected by Me', value: s.rejected_me, icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    { label: 'Total Handled', value: s.total_handled, icon: BarChart2, color: 'text-slate-500', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
  ]

  return (
    <div className="card overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 shadow-sm border border-slate-200">
      {stats.map(({ label, value, icon: Icon, color, bgColor, borderColor }) => (
        <div key={label} className="flex-1 p-5 bg-white flex items-center justify-between">
          <div className="space-y-1.5">
            <span className={`text-[10px] font-bold ${color} uppercase tracking-widest`}>{label}</span>
            <div className="text-2xl font-heading font-semibold text-slate-900 tabular-nums">{value}</div>
          </div>
          <div className={`h-10 w-10 rounded ${bgColor} border ${borderColor} flex items-center justify-center`}>
            <Icon className={`h-4.5 w-4.5 ${color}`} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function HodStatsSkeleton() {
  return (
    <div className="card overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 shadow-sm border border-slate-200 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex-1 p-5 bg-white flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-2 w-24 bg-slate-100 rounded" />
            <div className="h-8 w-12 bg-slate-200 rounded" />
          </div>
          <div className="h-10 w-10 bg-slate-50 rounded" />
        </div>
      ))}
    </div>
  )
}
