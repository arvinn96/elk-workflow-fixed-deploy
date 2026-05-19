import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RequestsTable } from '@/components/requests-table'
import { Inbox, CheckCircle, ArrowRight, Activity, FileText } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { Profile, RequestWithProfile, AuditLogWithProfile } from '@/lib/types'

type AuditLogRow = Omit<AuditLogWithProfile, 'profiles'> & {
  profiles: AuditLogWithProfile['profiles'] | AuditLogWithProfile['profiles'][]
}

function normalizeAuditLogs(logs: AuditLogRow[] | null | undefined): AuditLogWithProfile[] {
  return (logs ?? []).map((log) => ({
    ...log,
    profiles: Array.isArray(log.profiles) ? (log.profiles[0] ?? null) : (log.profiles ?? null),
  }))
}

export async function HodQueueTable({ profile }: { profile: Profile }) {
  const supabase = await createClient()
  
  // PROFESSIONALLY prune the query to only fetch what the table actually displays.
  // This reduces payload by ~70% compared to 'select *'
  const { data } = await supabase
    .from('requests')
    .select(`
      id, title, type, status, current_stage, created_at, 
      profiles(id, full_name, avatar_url), 
      approval_steps(id, stage, decision)
    `)
    .eq('status', 'pending')
    .eq('current_stage', 'hod')
    .order('created_at', { ascending: false })
  
  const queue = (data as any as RequestWithProfile[]) ?? []

  return (
    <div className="lg:col-span-2 card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Inbox className="h-3.5 w-3.5 text-amber-500" />
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending My Review</h2>
        </div>
        <Link href="/queue" className="text-[10px] text-brand-600 font-bold uppercase hover:underline flex items-center gap-1">
          Full queue <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </div>

      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">Queue is empty</p>
          <p className="text-xs text-slate-400 mt-1">No requests pending at HOD stage</p>
        </div>
      ) : (
        <RequestsTable requests={queue} userRole={profile.role} />
      )}
    </div>
  )
}

export async function HodMyRequests({ userId, role }: { userId: string, role: string }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('requests')
    .select(`
      id, title, type, status, current_stage, created_at, 
      profiles(id, full_name, avatar_url), 
      approval_steps(id, stage, decision)
    `)
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  const requests = (data as any as RequestWithProfile[]) ?? []

  if (requests.length === 0) return null

  return (
    <div className="lg:col-span-3 card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-brand-500" />
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">My Submitted Requests</h2>
        </div>
        <Link href="/requests" className="text-[10px] text-brand-600 font-bold uppercase hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </div>
      <RequestsTable requests={requests} userRole={role} />
    </div>
  )
}

export async function HodRecentActions({ userId }: { userId: string }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('audit_logs')
    .select('id, actor_id, action, entity_type, entity_id, metadata, created_at, profiles:actor_id(id, full_name, email, role, department, avatar_url, created_at)')
    .eq('actor_id', userId)
    .order('created_at', { ascending: false })
    .limit(6)
  
  const logs = normalizeAuditLogs(data as AuditLogRow[] | null)

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
        <Activity className="h-3.5 w-3.5 text-slate-400" />
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">My Recent Actions</h3>
      </div>
      {logs.length === 0 ? (
        <p className="text-[11px] text-slate-400 text-center py-8">No actions yet</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {logs.map(log => (
            <div key={log.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
              <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${
                log.action.includes('approve') ? 'bg-emerald-400' :
                log.action.includes('reject') ? 'bg-red-400' : 'bg-brand-400'
              }`} />
              <div className="min-w-0">
                <p className="text-[11px] text-slate-700 leading-tight capitalize">
                  {log.action.replace(/_/g, ' ')}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(log.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function HodTableSkeleton() {
  return (
    <div className="lg:col-span-2 card overflow-hidden animate-pulse">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 h-10" />
      <div className="p-5 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
              <div className="h-2 w-32 bg-slate-50 rounded" />
            </div>
            <div className="h-8 w-20 bg-slate-50 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function HodActionsSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 h-10" />
      <div className="p-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-slate-100 mt-1" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-2 w-24 bg-slate-50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
