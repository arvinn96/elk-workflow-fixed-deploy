import Link from 'next/link'
import { Suspense } from 'react'
import { Inbox, ChevronRight } from 'lucide-react'
import type { Profile } from '@/lib/types'

import { RealtimeRefresh } from '@/components/realtime-refresh'
import { ApprovalDashboardStats } from './approval-dashboard-stats'
import { 
  ApprovalQueueTable, 
  ApprovalRecentActions 
} from './approval-dashboard-content'

// Reuse skeletons for consistency
import { HodStatsSkeleton as StatsSkeleton } from './hod-dashboard-stats'
import { HodTableSkeleton as TableSkeleton } from './hod-dashboard-content'
import { HodActionsSkeleton as ActionsSkeleton } from './hod-dashboard-content'

interface Props {
  userId: string
  profile: Profile
}

export async function ApprovalDashboard({ userId, profile }: Props) {
  return (
    <div className="space-y-6 max-w-[1440px] mx-auto px-6 pb-12">
      <RealtimeRefresh />

      {/* 1. Header (Renders Instantly) */}
      <div className="flex items-center justify-between py-4 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest mb-1">
            <span>Home</span><ChevronRight className="h-2.5 w-2.5" />
            <span className="text-slate-600 font-bold">DT Dashboard</span>
          </div>
          <h1 className="text-xl font-heading font-bold text-slate-900">DT (A2) Review Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Review departmental requests and manage your DT stage approval queue.
          </p>
        </div>
        <Link
          href="/queue"
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded shadow-sm transition-colors"
        >
          <Inbox className="h-3.5 w-3.5" />
          Open Queue
        </Link>
      </div>

      {/* 2. Stats (Independent Stream) */}
      <Suspense fallback={<StatsSkeleton />}>
        <ApprovalDashboardStats userId={userId} />
      </Suspense>

      {/* 3. Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Queue table (Independent Stream) */}
        <Suspense fallback={<TableSkeleton />}>
          <ApprovalQueueTable role={profile.role} />
        </Suspense>

        {/* Right Column: Recent Actions (Independent Stream) */}
        <Suspense fallback={<ActionsSkeleton />}>
          <ApprovalRecentActions userId={userId} />
        </Suspense>
      </div>
    </div>
  )
}

