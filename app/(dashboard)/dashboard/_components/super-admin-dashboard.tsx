import { Suspense } from 'react'
import type { Profile } from '@/lib/types'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { DashboardStats, StatsSkeleton } from './dashboard-stats'
import { DashboardChartsWrapper, ChartsSkeleton } from './dashboard-charts-wrapper'
import { DashboardRecentTable, TableSkeleton } from './dashboard-recent-table'
import { Layers2 } from 'lucide-react'
import { SuperAdminTabs } from './super-admin-tabs'

interface Props {
  userId: string
  profile: Profile
}

export async function SuperAdminDashboard({ profile }: Props) {
  const today = new Date()
  const todayStr = today.toLocaleDateString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-slate-50 p-6 max-w-[1440px] mx-auto space-y-8">
      <RealtimeRefresh />
      
      {/* 1. Header (Renders Instantly) */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
               <Layers2 className="h-5 w-5 text-brand-600" />
             </div>
             <div>
               <h1 className="text-xl font-heading font-black text-slate-900 leading-tight">
                 ELK-DESA Dashboard
               </h1>
               <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-widest font-bold">
                 System Overview &amp; Analytics — {profile.full_name}
               </p>
             </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dashboard Date</span>
          <span className="text-xs text-slate-900 font-bold tabular-nums">{todayStr}</span>
        </div>
      </div>

      <div className="h-px bg-slate-200 w-full" />

      {/* 2. Stats (Independent Stream — renders as soon as RPC returns) */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats profile={profile} />
      </Suspense>

      {/* 3. Charts (Independent Stream — shares cached RPC with Stats) */}
      <Suspense fallback={<ChartsSkeleton />}>
        <DashboardChartsWrapper profile={profile} />
      </Suspense>

      {/* 4. Projects Table (Independent Stream — renders separately) */}
      <Suspense fallback={<TableSkeleton />}>
        <DashboardRecentTable profile={profile} />
      </Suspense>
    </div>
  )
}
