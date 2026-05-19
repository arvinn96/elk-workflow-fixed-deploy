'use client'

import { useEffect, useState, useTransition, useMemo, useCallback } from 'react'
import { Plus, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RequestsTable } from '@/components/requests-table'
import { AdminDeletionActions } from '@/components/admin-deletion-actions'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { RequestWithProfile, RequestStatus, Role } from '@/lib/types'
import { triggerRequestDrawer } from '@/lib/events'
import { REQUEST_LIST_SELECT } from '@/lib/supabase/selects'

type FilterTab = 'all' | RequestStatus

async function readRequests() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      role: '',
      requests: [] as RequestWithProfile[],
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, department')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? ''
  let query = supabase
    .from('requests')
    .select(REQUEST_LIST_SELECT)
    .order('created_at', { ascending: false })

  if (role === 'hod') {
    query = query.eq('department', profile?.department ?? '')
  } else if (!['approval', 'admin', 'super_admin', 'ucd'].includes(role)) {
    query = query.eq('submitted_by', user.id)
  }

  const { data } = await query.limit(100)

  return {
    role,
    requests: (data as RequestWithProfile[]) ?? [],
  }
}

import { usePagination } from '@/hooks/use-pagination'

export default function RequestsPage() {
  const [role, setRole] = useState<Role | ''>('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [isPending, startTransition] = useTransition()

  const fetcher = useCallback(async (offset: number, limit: number) => {
    const res = await fetch(`/api/requests?offset=${offset}&limit=${limit}&status=${activeTab === 'all' ? '' : activeTab}`)
    if (!res.ok) return []
    const data = await res.json()
    if (data.role) setRole(data.role)
    return data.requests || []
  }, [activeTab])

  const { items: requests, loading, hasMore, loadMore, refresh } = usePagination<RequestWithProfile>(fetcher, 20)

  useEffect(() => {
    void refresh()
  }, [activeTab, refresh])

  const handleRefresh = useCallback(() => {
    void refresh()
  }, [refresh])

  const pageTitle = role === 'hod'
    ? 'Department Requests'
    : ['approval', 'admin', 'super_admin'].includes(role)
      ? 'All Requests'
      : 'Requests'

  const pageDescription = role === 'hod'
    ? 'Manage and track requests from your department'
    : ['approval', 'admin', 'super_admin'].includes(role)
      ? 'Manage and track all system requests'
      : 'Manage and track all your approval requests'

  return (
    <>
      <div className="space-y-5 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-medium text-slate-900">{pageTitle}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{pageDescription}</p>
          </div>
          <Button onClick={() => triggerRequestDrawer()}>
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </div>

        {role === 'super_admin' && (
          <AdminDeletionActions onSuccess={refresh} />
        )}

        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value as FilterTab)
          }}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className={cn("card overflow-hidden transition-opacity", isPending && "opacity-60")}>
          {loading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="px-4 py-20 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 mb-2">
                  <FileText className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-900">No requests found</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {activeTab === 'all' ? 'Submit your first request to get started' : `No ${activeTab} requests`}
                </p>
                {activeTab === 'all' && (
                  <Button size="sm" className="mt-4" onClick={() => triggerRequestDrawer()}>
                    <Plus className="h-3.5 w-3.5" />
                    New Request
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <RequestsTable 
                requests={requests} 
                userRole={role}
                allowDeletion={true}
                onRefresh={handleRefresh}
                navigateOnRowClick={false}
              />
              
              {hasMore && (
                <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/30">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => loadMore()} 
                    disabled={loading}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-600"
                  >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                    Load More Requests
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


    </>
  )
}
