// Server-side cached data fetchers for the dashboard.
// Using React cache() ensures that multiple Server Components in the same
// render tree share a single DB result instead of firing duplicate queries.

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { REQUEST_LIST_SELECT } from '@/lib/supabase/selects'

/**
 * Cached wrapper around the get_dashboard_stats RPC.
 * Both DashboardStats and DashboardChartsWrapper use this,
 * so React deduplicates the call within a single render pass.
 */
export const getDashboardStats = cache(async () => {
  const t0 = performance.now()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_dashboard_stats')
  console.log(`[PERF] getDashboardStats RPC: ${Math.round(performance.now() - t0)}ms, error: ${!!error}`)

  if (error || !data) {
    console.warn('get_dashboard_stats RPC failed, falling back...')
    // Fallback: parallel count queries
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

  // The enhanced RPC returns { stats: {}, trends: [] }
  // Handle both old format (flat) and new format (nested)
  if (data.stats) {
    return data as { stats: any; trends: any[] }
  }
  // Old format fallback (flat object without trends)
  return { stats: data, trends: [] }
})

/**
 * Cached fetcher for layout notifications. 
 * Consolidates the logic from TopbarWrapper into a single, deduplicated server call.
 */
export const getLayoutNotifications = cache(async (profile: any) => {
  const t0 = performance.now()
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

  console.log(`[PERF] getLayoutNotifications: ${Math.round(performance.now() - t0)}ms`)
  return notifications
})

/**
 * Pre-fetch ALL Super Admin dashboard data in one cached call.
 * This creates a SINGLE Supabase client and runs ALL queries in parallel,
 * eliminating multiple createClient()/cookies() overhead.
 */
export const getSuperAdminDashboardData = cache(async (profile: any) => {
  const t0 = performance.now()
  const supabase = await createClient()

  // Fire ALL queries in parallel — one client, one cookies() call
  // We reuse the getLayoutNotifications logic by calling it here (it's cached!)
  const [rpcResult, recentResult, notifications] = await Promise.all([
    supabase.rpc('get_dashboard_stats'),
    supabase.from('requests')
      .select(REQUEST_LIST_SELECT)
      .order('created_at', { ascending: false })
      .limit(10),
    getLayoutNotifications(profile)
  ])

  console.log(`[PERF] getSuperAdminDashboardData (all parallel): ${Math.round(performance.now() - t0)}ms`)

  // Parse RPC
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
    notifications,
  }
})
