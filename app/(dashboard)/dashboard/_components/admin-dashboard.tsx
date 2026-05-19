import Link from 'next/link'
import { Suspense } from 'react'
import { Inbox, ChevronRight } from 'lucide-react'
import type { Profile } from '@/lib/types'

import { RealtimeRefresh } from '@/components/realtime-refresh'
import { AdminDashboardStats } from './admin-dashboard-stats'
import { 
  AdminQueueTable, 
  AdminRecentRequests, 
  AdminSystemActivity 
} from './admin-dashboard-content'

// Reuse skeletons from other dashboard components for consistency
import { HodStatsSkeleton as AdminStatsSkeleton } from './hod-dashboard-stats'
import { HodTableSkeleton as AdminTableSkeleton } from './hod-dashboard-content'
import { HodActionsSkeleton as ActivitySkeleton } from './hod-dashboard-content'

interface Props {
  userId: string
  profile: Profile
}

export async function AdminDashboard({ userId, profile }: Props) {
  return (
    <div className="space-y-6 max-w-[1440px] mx-auto px-6 pb-12">
      <RealtimeRefresh />

      {/* 1. Header (Renders Instantly) */}
      <div className="flex items-center justify-between py-4 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest mb-1">
            <span>Home</span><ChevronRight className="h-2.5 w-2.5" />
            <span className="text-slate-600 font-bold">Admin Dashboard</span>
          </div>
          <h1 className="text-xl font-heading font-bold text-slate-900">Admin (A3) Review Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage system-wide requests and process the admin approval queue.
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
      <Suspense fallback={<AdminStatsSkeleton />}>
        <AdminDashboardStats userId={userId} />
      </Suspense>

      {/* 3. Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Admin queue + All requests (Independent Streams) */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<AdminTableSkeleton />}>
            <AdminQueueTable role={profile.role} />
          </Suspense>

          <Suspense fallback={<AdminTableSkeleton />}>
            <AdminRecentRequests role={profile.role} />
          </Suspense>
        </div>

        {/* Right: audit log (Independent Stream) */}
        <Suspense fallback={<ActivitySkeleton />}>
          <AdminSystemActivity />
        </Suspense>
      </div>
    </div>
  )
}

