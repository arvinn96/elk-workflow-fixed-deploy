import { createClient } from '@/lib/supabase/server'
import { FileText, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import type { RequestWithProfile } from '@/lib/types'

export async function UserDashboardStats({ userId }: { userId: string }) {
  const supabase = await createClient()
  
  // PROFESSIONALLY use parallel count-only queries (head: true) 
  // to avoid downloading dozens/hundreds of rows just to count them.
  const [
    { count: total }, 
    { count: pending }, 
    { count: approved }, 
    { count: rejected }
  ] = await Promise.all([
    supabase.from('requests').select('*', { count: 'exact', head: true }).eq('submitted_by', userId),
    supabase.from('requests').select('*', { count: 'exact', head: true }).eq('submitted_by', userId).eq('status', 'pending'),
    supabase.from('requests').select('*', { count: 'exact', head: true }).eq('submitted_by', userId).eq('status', 'approved'),
    supabase.from('requests').select('*', { count: 'exact', head: true }).eq('submitted_by', userId).eq('status', 'rejected'),
  ])
  
  const approvedNum = approved ?? 0
  const rejectedNum = rejected ?? 0
  const approvalRate = (approvedNum + rejectedNum) > 0
    ? Math.round((approvedNum / (approvedNum + rejectedNum)) * 100) : 0

  const stats = [
    { label: 'Total Submitted', value: total ?? 0, icon: FileText, color: 'slate', textColor: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
    { label: 'In Pipeline', value: pending ?? 0, icon: Clock, color: 'amber', textColor: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    { label: 'Approved', value: approvedNum, icon: CheckCircle, color: 'emerald', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    { label: 'Rejected', value: rejectedNum, icon: XCircle, color: 'red', textColor: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    { label: 'Approval Rate', value: `${approvalRate}%`, icon: TrendingUp, color: 'brand', textColor: 'text-brand-600', bgColor: 'bg-brand-50', borderColor: 'border-brand-200' },
  ]

  return (
    <div className="card overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 shadow-sm border border-slate-200">
      {stats.map(({ label, value, icon: Icon, textColor, bgColor, borderColor }) => (
        <div key={label} className="flex-1 p-5 bg-white flex items-center justify-between">
          <div className="space-y-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${textColor} whitespace-nowrap`}>
              {label}
            </span>
            <div className="text-2xl font-heading font-semibold text-slate-900 tabular-nums">{value}</div>
          </div>
          <div className={`h-10 w-10 rounded ${bgColor} border ${borderColor} flex items-center justify-center`}>
            <Icon className={`h-4.5 w-4.5 ${textColor}`} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function UserStatsSkeleton() {
  return (
    <div className="card overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 shadow-sm border border-slate-200 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex-1 p-5 bg-white flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-2 w-20 bg-slate-100 rounded" />
            <div className="h-8 w-12 bg-slate-200 rounded" />
          </div>
          <div className="h-10 w-10 bg-slate-50 rounded" />
        </div>
      ))}
    </div>
  )
}
