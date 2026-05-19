import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RequestsTable } from '@/components/requests-table'
import { Clock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { RequestWithProfile } from '@/lib/types'

import { REQUEST_LIST_SELECT } from '@/lib/supabase/selects'

export async function UserActiveRequests({ userId }: { userId: string }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('requests')
    .select(REQUEST_LIST_SELECT)
    .eq('submitted_by', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  
  const requests = (data as unknown as RequestWithProfile[]) ?? []

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Pipeline</h2>
        </div>
        <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
          {requests.length} in progress
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No active requests</p>
          <p className="text-xs text-slate-400 mt-1">Submit a new request to start the approval process</p>
        </div>
      ) : (
        <RequestsTable requests={requests} />
      )}
    </div>
  )
}

export async function UserNeedsAttention({ userId }: { userId: string }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('requests')
    .select(REQUEST_LIST_SELECT)
    .eq('submitted_by', userId)
    .eq('status', 'rejected')
    .order('updated_at', { ascending: false })
    .limit(3)
  
  const requests = (data as unknown as RequestWithProfile[]) ?? []

  if (requests.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-red-100 flex items-center gap-2 bg-red-50/40">
        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
        <h2 className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Needs Attention</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {requests.map(req => (
          <div key={req.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-red-50/20 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate">{req.title}</p>
              <p className="text-[11px] text-red-500 mt-0.5">Rejected · {formatDateTime(req.updated_at)}</p>
            </div>
            <Link
              href="/requests"
              className="text-[10px] text-brand-600 font-bold uppercase hover:underline ml-4 whitespace-nowrap flex items-center gap-1"
            >
              View <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export async function UserRecentlyApproved({ userId }: { userId: string }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('requests')
    .select(REQUEST_LIST_SELECT)
    .eq('submitted_by', userId)
    .eq('status', 'approved')
    .order('updated_at', { ascending: false })
    .limit(3)
  
  const requests = (data as unknown as RequestWithProfile[]) ?? []

  if (requests.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-emerald-100 flex items-center gap-2 bg-emerald-50/40">
        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
        <h2 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Recently Approved</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {requests.map(req => (
          <div key={req.id} className="px-5 py-3.5 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate">{req.title}</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Approved · {formatDateTime(req.updated_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RequestsSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 h-10" />
      <div className="p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
              <div className="h-2 w-32 bg-slate-50 rounded" />
            </div>
            <div className="h-6 w-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
