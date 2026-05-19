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
  const { data, error } = await supabase.rpc('get_dashboard_stats')

  if (error || !data) {
    const [
      { count: inbox },
      { count: grooming },
      { count: pendingApproval },
      { count: approved },
      { count: inSprint },
      { count: inUat },
      { count: done },
    ] = await Promise.all([
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending').in('current_stage', ['hod', 'approval']),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('current_stage', 'admin'),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('current_stage', 'super_admin'),
      supabase.from('requests').select('*', { count: 'exact', head: true }).in('status', ['approved', 'sprint', 'uat', 'completed']),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'sprint'),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'uat'),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    ])
    return {
      stats: {
        inbox, grooming, pending_approval: pendingApproval, approved,
        in_sprint: inSprint, in_uat: inUat, done,
        total: (inbox ?? 0) + (grooming ?? 0) + (pendingApproval ?? 0) + (approved ?? 0),
      },
      trends: [],
    }
  }

  if (data.stats) return data as { stats: any; trends: any[] }
  return { stats: data, trends: [] }
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

  const [rpcResult, recentResult] = await Promise.all([
    supabase.rpc('get_dashboard_stats'),
    supabase.from('requests')
      .select(REQUEST_LIST_SELECT)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const rpcData = rpcResult.data
  let dashStats: { stats: any; trends: any[] }
  if (rpcResult.error || !rpcData) {
    dashStats = { stats: { inbox: 0, grooming: 0, pending_approval: 0, approved: 0, in_sprint: 0, in_uat: 0, done: 0, total: 0 }, trends: [] }
  } else if (rpcData.stats) {
    dashStats = rpcData as { stats: any; trends: any[] }
  } else {
    dashStats = { stats: rpcData, trends: [] }
  }

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
