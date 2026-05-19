import type { RequestWithProfile, Profile } from '@/lib/types'
import { RequestsTable } from '@/components/requests-table'
import { getSuperAdminDashboardData } from '@/lib/supabase/dashboard-data'

export async function DashboardRecentTable({ profile }: { profile: Profile }) {
  // Shares the same cached data as DashboardStats and DashboardChartsWrapper
  const { recentRequests } = await getSuperAdminDashboardData(profile)
  // Cast as unknown first to satisfy strict property checking for partial "Data Diet" results
  const systemRequests = (recentRequests as unknown as RequestWithProfile[]) ?? []

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-bold text-slate-900">System Approval Requests</h2>
        <p className="text-xs text-slate-500 mt-0.5">Recent requests processed through the main internal workflow</p>
      </div>
      <RequestsTable requests={systemRequests} userRole={profile.role} allowDeletion />
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div className="h-4 w-40 bg-slate-100 rounded" />
        <div className="h-4 w-20 bg-slate-50 rounded" />
      </div>
      <div className="p-6 space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-slate-100 rounded-xl" />
              <div className="space-y-2">
                <div className="h-3 w-48 bg-slate-100 rounded" />
                <div className="h-2 w-24 bg-slate-50 rounded" />
              </div>
            </div>
            <div className="h-8 w-24 bg-slate-50 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
