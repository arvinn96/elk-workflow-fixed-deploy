import { getSuperAdminDashboardData } from '@/lib/supabase/dashboard-data'
import { DashboardChartsView } from './dashboard-charts-view'
import type { Profile } from '@/lib/types'

export async function DashboardChartsWrapper({ profile }: { profile: Profile }) {
  // Shares the same cached data as DashboardStats and DashboardRecentTable
  const { stats: s, trends: trendData } = await getSuperAdminDashboardData(profile)

  const projectsPerMonthData = (trendData ?? []).map((d: any) => ({
    month: d.month,
    projects: d.projects
  }))

  const realisedData = (trendData ?? []).map((d: any) => ({
    month: d.month,
    realised: d.realised,
    unrealised: d.unrealised
  }))

  const stageData = [
    { stage: 'Inbox',            value: s.inbox,            fill: '#6366f1' },
    { stage: 'Grooming',         value: s.grooming,         fill: '#8b5cf6' },
    { stage: 'Pending Approval', value: s.pending_approval, fill: '#f97316' },
    { stage: 'Approved',         value: s.approved,         fill: '#10b981' },
    { stage: 'Sprint',           value: s.in_sprint,        fill: '#ec4899' },
    { stage: 'UAT',              value: s.in_uat,           fill: '#3b82f6' },
    { stage: 'Done',             value: s.done,             fill: '#14b8a6' },
  ]

  return (
    <DashboardChartsView 
      realisedData={realisedData}
      stageData={stageData}
      projectsPerMonthData={projectsPerMonthData}
      total={s.total ?? 0}
      revenueProjects={0}
      costProjects={0}
      timeHours={0}
    />
  )
}

export function ChartsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 h-[320px] bg-white rounded-2xl border border-slate-100 animate-pulse" />
        <div className="lg:col-span-2 h-[320px] bg-white rounded-2xl border border-slate-100 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[320px] bg-white rounded-2xl border border-slate-100 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
