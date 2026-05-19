import Link from 'next/link'
import { Suspense } from 'react'
import { Plus, ArrowRight } from 'lucide-react'
import type { Profile } from '@/lib/types'

import { RealtimeRefresh } from '@/components/realtime-refresh'
import { UserDashboardStats, UserStatsSkeleton } from './user-dashboard-stats'
import { UserDashboardActivity, ActivitySkeleton } from './user-dashboard-activity'
import { 
  UserActiveRequests, 
  UserNeedsAttention, 
  UserRecentlyApproved,
  RequestsSkeleton 
} from './user-dashboard-tables'

interface Props {
  userId: string
  profile: Profile
}

export async function UserDashboard({ userId, profile }: Props) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto px-6 pb-12">
      <RealtimeRefresh />

      {/* 1. Header (Renders Instantly) */}
      <div className="flex items-center justify-between py-4 border-b border-slate-200/60">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">My Workspace</p>
          <h1 className="text-xl font-heading font-bold text-slate-900">
            {greeting}, {firstName}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your approval requests and track their progress through the pipeline.
          </p>
        </div>
        <Link
          href="/requests?new=true"
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded shadow-sm transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Request
        </Link>
      </div>

      {/* 2. Stats Strip (Independent Stream) */}
      <Suspense fallback={<UserStatsSkeleton />}>
        <UserDashboardStats userId={userId} />
      </Suspense>

      {/* 3. Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left Column: Requests */}
        <div className="lg:col-span-2 space-y-4">
          <Suspense fallback={<RequestsSkeleton />}>
            <UserActiveRequests userId={userId} />
          </Suspense>

          <Suspense fallback={<RequestsSkeleton />}>
            <UserNeedsAttention userId={userId} />
          </Suspense>

          <Suspense fallback={<RequestsSkeleton />}>
            <UserRecentlyApproved userId={userId} />
          </Suspense>
        </div>

        {/* Right Column: Information & Activity */}
        <div className="space-y-4">
          {/* Quick submit */}
          <div className="card p-5 border-l-4" style={{ borderLeftColor: '#c8102e' }}>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Quick Submit</h3>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
              Start a new request and route it through the approval chain.
            </p>
            <Link
              href="/requests?new=true"
              className="flex items-center justify-center gap-2 w-full bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold uppercase tracking-wider py-2.5 rounded transition-colors"
            >
              New Request <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Activity feed (Independent Stream) */}
          <Suspense fallback={<ActivitySkeleton />}>
            <UserDashboardActivity userId={userId} />
          </Suspense>

          {/* All requests link */}
          <Link
            href="/requests"
            className="flex items-center justify-between w-full card px-4 py-3 hover:bg-slate-50 transition-colors group"
          >
            <span className="text-xs font-semibold text-slate-600">View all my requests</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-600 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  )
}

