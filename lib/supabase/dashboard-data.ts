// Server-side cached data fetchers for the dashboard.
// React cache() deduplicates within a single render pass.
// unstable_cache persists results across requests (cross-request caching).
//
// IMPORTANT: unstable_cache cannot use createClient() because it calls cookies().
// We use createServiceClient() inside cached functions instead.

import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { REQUEST_LIST_SELECT } from '@/lib/supabase/selects'

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

async function _fetchDashboardStats() {
  const supabase = await createServiceClient()

  // Calculate real live stats directly from the table
  const { data: requests } = await supabase
    .from('requests')
    .select('status, current_stage, created_at')

  const allReqs = requests || []

  // Aggregate Stage Distribution
  const stats = {
    inbox: allReqs.filter(r => r.status === 'pending' && r.current_stage === 'hod').length,
    grooming: allReqs.filter(r => r.status === 'pending' && r.current_stage === 'approval').length,
    pending_approval: allReqs.filter(r => r.status === 'pending' && ['admin', 'super_admin'].includes(r.current_stage)).length,
    approved: allReqs.filter(r => r.status === 'approved').length,
    in_sprint: allReqs.filter(r => r.status === 'sprint').length,
    in_uat: allReqs.filter(r => r.status === 'uat').length,
    done: allReqs.filter(r => r.status === 'completed').length,
    total: allReqs.length
  }

  // Aggregate Projects Per Month (Real Data)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const trendsMap: Record<string, number> = {}

  allReqs.forEach(r => {
    const d = new Date(r.created_at)
    const monthStr = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`
    trendsMap[monthStr] = (trendsMap[monthStr] || 0) + 1
  })

  // Format into an array sorted by time (for simplicity, we just use the last 6 months)
  const trends = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthStr = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`
    trends.push({
      month: monthStr,
      projects: trendsMap[monthStr] || 0,
      realised: 0,   // Placeholder until financial logic is added
      unrealised: 0  // Placeholder until financial logic is added
    })
  }

  return { stats, trends }
}

// Cache for 30s across requests — safe because it uses service client (no cookies)
const _getCachedStats = unstable_cache(
  _fetchDashboardStats,
  ['dashboard-stats-global'],
  { revalidate: 30 }
)

/**
 * React-cache deduplicates within a render; unstable_cache persists across requests.
 */
export const getDashboardStats = cache(async () => {
  return _getCachedStats()
})

// ─── Layout Notifications ─────────────────────────────────────────────────────

/**
 * Cached fetcher for layout notifications.
 * Uses createClient() (needs cookies for RLS) — only deduped per-request via React cache.
 */
export const getLayoutNotifications = cache(async (profile: any) => {
  const supabase = await createClient()
  const { stageForRole } = await import('@/lib/types')
  const stage = stageForRole(profile.role)
  let notifications: any[] = []

  if (stage) {
    let queueQuery = supabase
      .from('requests')
      .select('id, title, created_at, department')
      .eq('status', 'pending')
      .eq('current_stage', stage)
      .order('created_at', { ascending: false })
      .limit(5)

    if (profile.role === 'hod') {
      queueQuery = queueQuery.eq('department', profile.department ?? '')
    }

    const { data } = await queueQuery
    notifications = (data ?? []).map((request) => ({
      id: request.id,
      title: request.title,
      detail: profile.role === 'hod'
        ? `${request.department ?? 'Your'} team is waiting on you`
        : 'Awaiting your approval',
      href: '/queue',
      timestamp: request.created_at,
    }))
  } else {
    const { data } = await supabase
      .from('requests')
      .select('id, title, status, updated_at')
      .eq('submitted_by', profile.id)
      .order('updated_at', { ascending: false })
      .limit(5)

    notifications = (data ?? []).map((request) => ({
      id: request.id,
      title: request.title,
      detail: `Status: ${request.status}`,
      href: profile.role === 'super_admin' ? '/dashboard' : '/requests',
      timestamp: request.updated_at,
    }))
  }

  return notifications
})

// ─── Super Admin Dashboard ────────────────────────────────────────────────────

// Safe to cache — uses service client, no cookies dependency
async function _fetchSuperAdminData() {
  const supabase = await createServiceClient()

  const [dashStats, recentResult] = await Promise.all([
    _fetchDashboardStats(),
    supabase.from('requests')
      .select(REQUEST_LIST_SELECT)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return {
    ...dashStats,
    recentRequests: recentResult.data ?? [],
  }
}

const _getCachedSuperAdminData = unstable_cache(
  _fetchSuperAdminData,
  ['dashboard-super-admin-data'],
  { revalidate: 30 }
)

/**
 * Pre-fetch ALL Super Admin dashboard data.
 * Notifications are fetched separately (needs cookies) and merged.
 */
export const getSuperAdminDashboardData = cache(async (profile: any) => {
  // Run cached data-fetch and notification fetch in parallel
  const [cachedData, notifications] = await Promise.all([
    _getCachedSuperAdminData(),
    getLayoutNotifications(profile),
  ])
  return { ...cachedData, notifications }
})
