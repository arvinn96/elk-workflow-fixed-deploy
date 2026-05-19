import { createClient } from '@/lib/supabase/server'
import { Clock, CheckCircle, XCircle, BarChart2 } from 'lucide-react'

export async function ApprovalDashboardStats({ userId }: { userId: string }) {
  const supabase = await createClient()

  const [
    { count: queueCount },
    { data: stepsRaw }
  ] = await Promise.all([
    supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('current_stage', 'approval'),
    supabase
      .from('approval_steps')
      .select('decision')
      .eq('decided_by', userId)
      .neq('decision', 'pending')
  ])

  const mySteps = stepsRaw ?? []
  const approvedByMe = mySteps.filter(s => s.decision === 'approved').length
  const rejectedByMe = mySteps.filter(s => s.decision === 'rejected').length
  const totalHandled  = mySteps.length

  const stats = [
    { label: 'Awaiting My Review', value: queueCount ?? 0, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    { label: 'Approved by Me', value: approvedByMe, icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    { label: 'Rejected by Me', value: rejectedByMe, icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    { label: 'Total Handled', value: totalHandled, icon: BarChart2, color: 'text-slate-500', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
  ]

  return (
    <div className="card overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 shadow-sm border border-slate-200">
      {stats.map(({ label, value, icon: Icon, color, bgColor, borderColor }) => (
        <div key={label} className="flex-1 p-5 bg-white flex items-center justify-between">
          <div className="space-y-1.5">
            <span className={`text-[10px] font-bold ${color} uppercase tracking-widest whitespace-nowrap`}>{label}</span>
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
